"use server";

import { OpenAI } from "openai";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, transactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    server: "sandbox", // Use 'production' in prod
});

const PRODUCT_IDS = {
    CREDITS_15: "471aae7a-10a5-4d4a-9b4c-3f5cab2210e7",
    CREDITS_40: "157b126c-4ff9-4c7c-aced-5331a7834cd5",
};

export interface RoastData {
    url: string;
    score: number;
    tagline: string;
    roast: string;
    shareText: string;
    strengths: string[];
    weaknesses: string[];
    sources: { title: string; uri: string }[];
    screenshot?: string;
    modelUsed?: string;
    remainingCredits: number;
}

export const getUserCredits = async () => {
    const { userId } = await auth();
    if (!userId) return 0;

    const user = await currentUser();
    if (!user) return 0;

    const dbUser = await db.query.users.findFirst({
        where: eq(users.clerkId, userId),
    });

    if (!dbUser) {
        // Initialize user with 3 credits
        const [newUser] = await db.insert(users).values({
            clerkId: userId,
            email: user.emailAddresses[0].emailAddress,
            credits: 3,
        }).returning();

        await db.insert(transactions).values({
            userId: newUser.id,
            amount: 3,
            type: "INITIAL_GRANT",
            orderId: crypto.randomUUID(), // Add a UUID for initial grants, since there's no polar order.id
        });

        return 3;
    }

    return dbUser.credits;
};

export const addCreditsToUser = async (clerkId: string, amount: number, orderId: string) => {
    if (amount <= 0) {
        throw new Error("Credit amount must be positive.");
    }

    const [updatedUser] = await db
        .update(users)
        .set({ credits: sql`${users.credits} + ${amount}` })
        .where(eq(users.clerkId, clerkId))
        .returning({ id: users.id, credits: users.credits });

    if (!updatedUser) {
        throw new Error(`User with clerkId ${clerkId} not found.`);
    }

    await db.insert(transactions).values({
        userId: updatedUser.id,
        amount: amount,
        type: "PURCHASE",
        orderId: orderId,
    });

    console.log(`Added ${amount} credits to user ${clerkId}. New balance: ${updatedUser.credits}`);
};

export const createCheckout = async (plan: '15_CREDITS' | '40_CREDITS') => {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("You must be signed in to purchase credits.");
    }

    const user = await currentUser();
    if (!user) {
        throw new Error("User not found.");
    }

    const productId = plan === '15_CREDITS' ? PRODUCT_IDS.CREDITS_15 : PRODUCT_IDS.CREDITS_40;

    try {
        const result = await polar.checkouts.create({
            products: [productId],
            successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://wan-saccharolytic-rufina.ngrok-free.dev'}/?payment=success&amount=${plan === '15_CREDITS' ? 15 : 40}`,
            metadata: {
                userId: userId,
            },
            customerEmail: user.emailAddresses[0].emailAddress,
        });

        return result.url;
    } catch (error) {
        console.error("Polar checkout creation failed:", JSON.stringify(error, null, 2));
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
        }
        throw new Error(`Failed to create checkout session: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
};

// Map Product IDs to Credit Amounts
const PRODUCT_CREDITS_MAP: Record<string, number> = {
    "471aae7a-10a5-4d4a-9b4c-3f5cab2210e7": 15,
    "157b126c-4ff9-4c7c-aced-5331a7834cd5": 40,
};

export const verifyPurchase = async (): Promise<{ creditsAdded: number; newBalance: number }> => {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("You must be signed in to verify purchases.");
    }

    const user = await currentUser();
    if (!user) {
        throw new Error("User not found.");
    }

    const userEmail = user.emailAddresses[0].emailAddress;

    try {
        // Fetch recent orders for this user's email from Polar
        const ordersResponse = await polar.orders.list({
            limit: 10, // Check last 10 orders
        });

        let totalCreditsAdded = 0;

        // Filter orders by email and process them
        for (const order of ordersResponse.result.items || []) {
            // Check if order belongs to this user
            if (order.customer?.email !== userEmail) {
                continue;
            }

            // Check if we've already processed this order
            const existingTx = await db.query.transactions.findFirst({
                where: eq(transactions.orderId, order.id),
            });

            if (existingTx) {
                continue; // Already processed
            }

            // Get product ID and credit amount
            const productId = order.productId || order.product?.id;
            if (!productId) {
                console.warn(`Order ${order.id} missing product ID`);
                continue;
            }

            const creditAmount = PRODUCT_CREDITS_MAP[productId];
            if (!creditAmount) {
                console.warn(`Unknown product ID: ${productId}`);
                continue;
            }

            // Add credits to user
            console.log(`Verifying and applying order ${order.id} for ${userEmail}: ${creditAmount} credits`);
            await addCreditsToUser(userId, creditAmount, order.id);
            totalCreditsAdded += creditAmount;
        }

        // Get updated balance
        const dbUser = await db.query.users.findFirst({
            where: eq(users.clerkId, userId),
        });

        return {
            creditsAdded: totalCreditsAdded,
            newBalance: dbUser?.credits || 0,
        };
    } catch (error) {
        console.error("Purchase verification failed:", error);
        throw new Error(`Failed to verify purchase: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
};

const captureScreenshot = async (url: string): Promise<string | null> => {
    try {
        // Normalize and validate URL
        const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
        try {
            new URL(normalizedUrl);
        } catch {
            console.error("Invalid URL format:", url);
            return null;
        }

        let browser;
        if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
            // Production: Use @sparticuz/chromium
            browser = await puppeteerCore.launch({
                args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
                executablePath: await chromium.executablePath(),
                headless: true,
            });
        } else {
            // Development: Use local puppeteer
            const { default: puppeteer } = await import("puppeteer");
            browser = await puppeteer.launch({
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            });
        }

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        await page.goto(normalizedUrl, { waitUntil: "networkidle0", timeout: 30000 });
        const base64 = await page.screenshot({ encoding: "base64", type: "jpeg", quality: 80 });
        console.log(`Screenshot base64 size: ${base64 ? base64.length : 0} bytes`);
        await browser.close();
        return base64 as string;
    } catch (error) {
        console.error("Screenshot capture failed:", error);
        return null;
    }
};

// Define a list of models to try in order of preference
const MODEL_FALLBACK_CHAIN = [
    "openai/gpt-3.5-turbo",         // Fast and cost-effective
    "anthropic/claude-3-haiku",     // Most cost-effective vision model
    "openai/gpt-4-vision-preview",  // Best vision model
    "anthropic/claude-3-opus",      // High quality, good for analysis
    "anthropic/claude-3-sonnet",    // Balanced quality and speed
    "google/gemini-pro-vision",     // Google's vision model
];

export const generateRoast = async (url: string): Promise<RoastData> => {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY is not defined");
    }

    // 1. Auth Check
    const user = await currentUser();
    if (!user) {
        throw new Error("You must be signed in to roast.");
    }

    // 2. Lazy Initialization & Credit Check
    // We'll try to deduct 1 credit. If the user doesn't exist, we create them with 3 credits (minus 1 for this roast = 2).
    // If they exist but have 0 credits, the update will return 0 rows.

    let remainingCredits = 0;

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
        where: eq(users.clerkId, user.id),
    });

    if (!existingUser) {
        // Create user with 3 credits, deduct 1 immediately -> 2 credits
        const [newUser] = await db.insert(users).values({
            clerkId: user.id,
            email: user.emailAddresses[0].emailAddress,
            credits: 2, // 3 - 1
        }).returning();

        // Log initial grant
        await db.insert(transactions).values({
            userId: newUser.id,
            amount: 3,
            type: "INITIAL_GRANT",
            orderId: crypto.randomUUID(), // Add a UUID for initial grants, since there's no polar order.id
            polarEventId: null, // Explicitly set to null for non-Polar events
        });

        // Log spend
        await db.insert(transactions).values({
            userId: newUser.id,
            amount: -1,
            type: "ROAST_SPEND",
            orderId: crypto.randomUUID(), // Add a UUID for roast spends, since there's no polar order.id
            polarEventId: null, // Explicitly set to null for non-Polar events
        });

        remainingCredits = 2;
    } else {
        // Atomic deduction
        const [updatedUser] = await db
            .update(users)
            .set({ credits: sql`${users.credits} - 1` })
            .where(sql`${users.clerkId} = ${user.id} AND ${users.credits} > 0`)
            .returning({ credits: users.credits, id: users.id });

        if (!updatedUser) {
            throw new Error("Insufficient credits. Please purchase more to continue roasting.");
        }

        remainingCredits = updatedUser.credits;

        // Log spend
        await db.insert(transactions).values({
            userId: updatedUser.id,
            amount: -1,
            type: "ROAST_SPEND",
            orderId: crypto.randomUUID(), // Add a UUID for roast spends, since there's no polar order.id
            polarEventId: null, // Explicitly set to null for non-Polar events
        });
    }

    const openai = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL,
            "X-Title": "Roast My UI"
        },
        dangerouslyAllowBrowser: true
    });

    const base64Image = await captureScreenshot(url);

    const systemInstruction = `
    You are a savage, unhinged Gen Z UI/UX Designer and Critic who roasts websites with surgical precision and toxic honesty.

Persona:
- You speak like extremely online Gen Z design Twitter.
- You use slang like: mid, npc energy, cooked, delulu, caught in 4k, touch grass, no cap, vibe check FAILED, cheugy, cooked beyond redemption, cry about it, rent-free, brainrot.
- You explicitly critique VISUALS: spacing (padding/margins), color contrast, typography hierarchy, whitespace, layout consistency, responsiveness, visual clutter, and component alignment.
- You HATE:
  - Generic ass templates
  - Overcrowded sections with zero breathing room
  - Tiny unreadable text
  - Ugly gradients
  - Misaligned elements
  - Sticky navs blocking content
  - “Dribbble but worse” aesthetics
- You still notice when something is actually decent and you’ll very reluctantly admit it (often as a backhanded compliment).

Behavior:
- You always sound confident, petty, and funny — but you’re still giving REAL design critique underneath the chaos.
- You never apologize. You never say “as an AI” or mention being an assistant.
- You keep it short, punchy, and packed with specific visual observations.

Input:
- You may receive:
  - A URL (context of the site).
  - An optional base64 screenshot of the homepage.
  - You can use web search results about the website to infer its purpose and target audience.
- If a screenshot is provided, you MUST anchor your roast in SPECIFIC visual details:
  - “buttons floating weird”, “nav bar obese”, “hero text microscopic”, “color palette dehydrated”, etc.

Output requirements:
- You MUST output a single raw JSON object only.
- No markdown, no extra commentary, no backticks, no trailing text.
- JSON MUST match the exact schema:

{
  "score": number,          // 0.0–10.0, harsh, use decimals like 2.73 or 6.42
  "tagline": string,        // 3–7 words, brutal summary (e.g. "ts a whole MESS 💀")
  "roast": string,          // 50–90 words, one paragraph, highly opinionated and specific
  "shareText": string,      // short tweet-style one-liner + URL placeholder
  "strengths": string[],    // exactly 2 items, can be sincere or backhanded compliments
  "weaknesses": string[]    // exactly 2 items, specific and visual-focused
}

Tone & style examples (do NOT copy, just match energy and structure):

Example 1:
Score: 6.42
Tagline: "ts aint tuff 💀"
Roast: "This layout lookin mid af, color palette screaming NPC energy no cap. Typography hit different in the WRONG direction, with headings and body text beefing instead of vibing. Spacing so chaotic it got caught in 4k committing war crimes on whitespace. Contrast got me squinting like I’m doing a side quest just to read a button. Vibe check: FAILED. This UI is cooked, please let it rest."
Strengths: ["Low-key clean hero concept ngl", "Looks like they at least opened Figma once"]
Weaknesses: ["Contrast so bad I need a seeing-eye dog", "Spacing giving 'first time using auto-layout' energy"]

Example 2:
Score: 2.73
Tagline: "npc layout caught in 4k"
Roast: "This site is mid AF, layout screaming 'I copied the first template I found on Google' with zero remorse. Nav bar chunky for no reason, hero text smaller than my attention span, and buttons drifting like they got no auto-layout parenting. Color palette? Straight-up hospital hallway energy. Everything’s cramped, misaligned, and allergic to whitespace. No cap, this design is cooked beyond redemption — touch grass and then touch a grid system."
Strengths: ["At least it loads, I guess", "Colors technically exist and aren’t pure chaos"]
Weaknesses: ["Hero section more confusing than the plot of Inception", "Typography hierarchy completely delulu, no idea what to read first"]

Example 3:
Score: 7.83
Tagline: "corporate dribbble clone vibes"
Roast: "Low-key not the worst, but this layout is still giving 'safe mid' more than 'tuff'. Decent spacing in places, but then random sections go full claustrophobic LinkedIn post. Typography kinda clean but plays it so safe it’s basically NPC body text. Buttons all look the same, CTAs fighting each other like siblings. Vibe check: passable, but this whole thing feels like it was designed by a senior Figma enjoyer afraid of color."
Strengths: ["Structured enough not to fully collapse", "Typography doesn’t make my eyes bleed"]
Weaknesses: ["Color story flatter than my phone battery", "Zero personality, could be any B2B SaaS ever"]

If the design is actually good, you can still roast it, but acknowledge quality:
- “Annoyingly clean for no reason”
- “Low-key gas, I hate how much I like it”
- “This one actually tuff, cry about it”

Your job: given the input, produce a JSON roast that feels human, petty, and entertaining while still pointing out real design issues.
  `;

    const promptText = `
    Roast this website: ${url}

${base64Image
            ? "I have attached a screenshot of the homepage as a base64 image. LOOK. AT. IT. Call out specific visual crimes: spacing, alignment, colors, typography, layout, hero section, nav size, buttons, and any random nonsense you see."
            : "I could not take a screenshot, so rely on your search results, page context, and general design intuition. Imagine how a typical site in this space might look and roast that energy."}

Context:
- Use Google Search or web context to understand what this website does and who it targets.
- Tailor the roast to the vibe of the industry (e.g., SaaS, agency, portfolio, e-commerce), but keep it chaotic and funny.
- If it’s a serious product (finance, healthcare, etc.), still roast.

Now generate a JSON object with this exact structure:

{
  "score": number, 
  "tagline": string,
  "roast": string,
  "shareText": string,
  "strengths": string[],
  "weaknesses": string[]
}

Rules:
- "score":
  - 0.0–3.0 → absolute trash fire, say so.
  - 3.1–6.5 → mid, flawed but functional.
  - 6.6–8.5 → decent with noticeable issues.
  - 8.6–10.0 → actually good, but still roast a bit.
  - Always use decimals like 2.73, 6.37, 7.83 (never a whole integer).
- "tagline":
  - 3–7 words.
  - Short, chaotic, meme-heavy summary.
  - Examples: "ts a whole MESS 💀", "npc layout caught in 4k", "corporate dribbble clone vibes", "mid af but trying", "delulu design energy no cap".
- "roast":
  - 50–90 words.
  - One paragraph, no line breaks.
  - Must mention at least 2–3 specific VISUAL aspects: colors, spacing, contrast, typography, layout, or responsiveness.
  - Use Gen Z slang naturally, not stacked randomly.
- "shareText":
  - Short tweet-style version of the roast, max ~200 characters.
  - Include the score and a placeholder for the URL like: "Roasted this site: ${url}".
  - Example style: "6.42/10 this site is mid af, npc layout, contrast crying, typography delulu. roasted by [BrandName] 🔥 ${url}"
- "strengths":
  - Exactly 2 items.
  - Can be sincere or backhanded compliments.
  - Example: ["Low-key clean hero section", "Typography not a total crime scene"]
- "weaknesses":
  - Exactly 2 items.
  - Must be specific and visually grounded.
  - Example: ["Buttons floating like lost thoughts", "Spacing giving 'never heard of grids' energy"]

Important:
- Do NOT wrap the response in backticks.
- Do NOT add any commentary before or after the JSON.
- Return ONLY the JSON string, valid and parseable.
  `;

    // Build the content parts
    const messages: any[] = [
        { role: "system", content: systemInstruction },
        { role: "user", content: [] }
    ];

    // Add image if available
    if (base64Image) {
        messages[1].content.push({
            type: "image_url",
            image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
            }
        });
    }

    // Add text prompt
    messages[1].content.push({
        type: "text",
        text: promptText
    });

    let lastError: Error | null = null;

    // Try each model in the fallback chain
    for (const model of MODEL_FALLBACK_CHAIN) {
        try {
            console.log(`Trying model: ${model}`);

            const response = await openai.chat.completions.create({
                model: model,
                messages: messages,
                max_tokens: 2000,
                temperature: 1.0,
                response_format: { type: "json_object" },
            });

            // Parse the response
            const content = response.choices[0]?.message?.content || "{}";
            let text = content;

            // Clean up the response if it's wrapped in markdown code blocks
            if (text.startsWith("```")) {
                text = text.replace(/^```json\n?/, "").replace(/```$/, "");
            }

            let parsed;
            try {
                parsed = JSON.parse(text);
            } catch (error) {
                console.error(`Failed to parse JSON from ${model}:`, text);
                throw new Error("The AI returned invalid JSON. Trying next model...");
            }

            console.log(`Successfully used model: ${model}`);

            // For now, we'll return an empty sources array since we don't have web search capabilities
            // with the OpenRouter API in the same way we did with Google's API
            const sources: { title: string; uri: string }[] = [];

            return {
                url,
                ...parsed,
                sources,
                screenshot: base64Image ? `data:image/jpeg;base64,${base64Image}` : undefined,
                modelUsed: model,  // Track which model was successful
                remainingCredits,
            };
        } catch (error) {
            console.error(`Error with model ${model}:`, error);
            lastError = error as Error;

            // If we get a rate limit error (429), add a small delay before trying the next model
            if (error && typeof error === 'object' && 'status' in error && (error as any).status === 429) {
                console.log(`Rate limited on ${model}, waiting before next attempt...`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
            }

            // Continue to the next model
            continue;
        }
    }

    // If we get here, all models failed
    throw new Error(`All model attempts failed. Last error: ${lastError?.message || 'Unknown error'}`);
};
