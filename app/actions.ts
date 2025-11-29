/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import { OpenAI } from "openai";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, transactions, roasts } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { Polar } from "@polar-sh/sdk";


const polar = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    server: "production", // Use 'production' in prod
});

const PRODUCT_IDS = {
    CREDITS_15: "7ba92f29-5157-43d7-a2d5-32bc4a708111",
    CREDITS_40: "1dc7dc25-1a87-478a-b752-a0af02fb0cbf",
};

export interface RoastData {
    url: string;
    score: number;
    tagline: string;
    roast: string;
    shareText: string;
    strengths: string[];
    weaknesses: string[];
    visualCrimes: string[];
    bestPart: string;
    worstPart: string;
    sources: { title: string; uri: string }[];
    screenshot?: string;
    modelUsed?: string;
    remainingCredits: number;
    analysisType: 'hero' | 'full-page';
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
            successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://roast-my-ui.vercel.app'}/?payment=success&amount=${plan === '15_CREDITS' ? 15 : 40}`,
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

const captureScreenshot = async (url: string, fullPage: boolean = false): Promise<string | null> => {
    try {
        console.log("Starting captureScreenshot for URL:", url);
        console.log("NODE_ENV:", process.env.NODE_ENV);

        // Normalize and validate URL
        const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
        try {
            new URL(normalizedUrl);
        } catch {
            console.error("Invalid URL format:", url);
            throw new Error("The URL provided is invalid.");
        }

        // Use ScreenshotOne API in production, Puppeteer locally
        if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
            console.log("Using ScreenshotOne API for production...");

            const screenshotOneApiKey = process.env.SCREENSHOTONE_API_KEY;
            if (!screenshotOneApiKey) {
                console.error("SCREENSHOTONE_API_KEY not set, falling back to placeholder");
                // Return a placeholder or throw error
                throw new Error("Screenshot API key not configured");
            }

            // Build ScreenshotOne API URL
            const apiUrl = new URL("https://api.screenshotone.com/take");
            apiUrl.searchParams.set("access_key", screenshotOneApiKey);
            apiUrl.searchParams.set("url", normalizedUrl);
            apiUrl.searchParams.set("viewport_width", "1280");
            apiUrl.searchParams.set("viewport_height", "800");
            apiUrl.searchParams.set("device_scale_factor", "1");
            apiUrl.searchParams.set("format", "jpg");
            apiUrl.searchParams.set("image_quality", "80");
            apiUrl.searchParams.set("block_ads", "true");
            apiUrl.searchParams.set("block_cookie_banners", "true");
            apiUrl.searchParams.set("block_banners_by_heuristics", "false");
            apiUrl.searchParams.set("block_trackers", "true");
            apiUrl.searchParams.set("delay", "0");
            apiUrl.searchParams.set("timeout", "30");

            // Full page screenshot if requested
            if (fullPage) {
                apiUrl.searchParams.set("full_page", "true");
                apiUrl.searchParams.set("full_page_scroll", "true");
                apiUrl.searchParams.set("full_page_scroll_delay", "300");
                apiUrl.searchParams.set("full_page_max_height", "10000");
            }

            console.log("Fetching screenshot from ScreenshotOne API...");
            const response = await fetch(apiUrl.toString());

            if (!response.ok) {
                console.error("ScreenshotOne API error:", response.status, response.statusText);
                throw new Error(`We couldn't take a screenshot of that site (Error: ${response.status}). It might be down, blocking bots, or just too powerful for us.`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            console.log(`Screenshot base64 size: ${base64.length} bytes`);
            return base64;
        } else {
            // Local development: use Puppeteer
            console.log("Launching local Puppeteer for development...");
            const { default: puppeteer } = await import("puppeteer");
            const browser = await puppeteer.launch({
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            });

            const page = await browser.newPage();
            await page.setViewport({ width: 1280, height: 800 });
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

            console.log("Navigating to URL:", normalizedUrl);
            await page.goto(normalizedUrl, { waitUntil: "networkidle0", timeout: 30000 });
            console.log("Navigation successful.");

            const base64 = await page.screenshot({
                encoding: "base64",
                type: "jpeg",
                quality: 80,
                fullPage: fullPage
            });
            console.log(`Screenshot base64 size: ${base64 ? base64.length : 0} bytes`);
            await browser.close();
            console.log("Browser closed.");
            return base64 as string;
        }
    } catch (error) {
        console.error("Screenshot capture failed:", error);
        if (error instanceof Error) throw error;
        throw new Error("Failed to capture screenshot due to an unknown error.");
    }
};

// Define a list of models to try in order of preference
const MODEL_FALLBACK_CHAIN = [
    "openai/gpt-4o-mini",           // Fallback: Very cheap, good vision
    "anthropic/claude-3-haiku",     // Fallback: Reliable vision model
];

export const generateRoast = async (url: string, analysisType: 'hero' | 'full-page' = 'hero'): Promise<RoastData> => {
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
    // Deduct credits based on analysis type: 1 for hero, 3 for full-page
    const creditsToDeduct = analysisType === 'full-page' ? 3 : 1;

    let remainingCredits = 0;
    let dbUserId: number;

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
        where: eq(users.clerkId, user.id),
    });

    if (!existingUser) {
        // Create user with 3 credits, deduct credits immediately
        const initialCredits = 3 - creditsToDeduct;
        if (initialCredits < 0) {
            throw new Error("Insufficient credits. Please purchase more to continue roasting.");
        }

        const [newUser] = await db.insert(users).values({
            clerkId: user.id,
            email: user.emailAddresses[0].emailAddress,
            credits: initialCredits,
        }).returning();

        // Log initial grant
        await db.insert(transactions).values({
            userId: newUser.id,
            amount: 3,
            type: "INITIAL_GRANT",
            orderId: crypto.randomUUID(),
            polarEventId: null,
        });

        // Log spend
        await db.insert(transactions).values({
            userId: newUser.id,
            amount: -creditsToDeduct,
            type: "ROAST_SPEND",
            orderId: crypto.randomUUID(),
            polarEventId: null,
        });

        remainingCredits = initialCredits;
        dbUserId = newUser.id;
    } else {
        // Atomic deduction
        const [updatedUser] = await db
            .update(users)
            .set({ credits: sql`${users.credits} - ${creditsToDeduct}` })
            .where(sql`${users.clerkId} = ${user.id} AND ${users.credits} >= ${creditsToDeduct}`)
            .returning({ credits: users.credits, id: users.id });

        if (!updatedUser) {
            throw new Error("Insufficient credits. Please purchase more to continue roasting.");
        }

        remainingCredits = updatedUser.credits;
        dbUserId = updatedUser.id;

        // Log spend
        await db.insert(transactions).values({
            userId: updatedUser.id,
            amount: -creditsToDeduct,
            type: "ROAST_SPEND",
            orderId: crypto.randomUUID(),
            polarEventId: null,
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

    let base64Image: string | null = null;
    try {
        base64Image = await captureScreenshot(url, analysisType === 'full-page');
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Failed to capture screenshot. We can't roast what we can't see. Please check the URL and try again.");
    }

    if (!base64Image) {
        throw new Error("Failed to capture screenshot. We can't roast what we can't see. Please check the URL and try again.");
    }

    const systemInstruction = `
    You are a ruthless design critic with 15 years of experience roasting websites. You've seen every trend, every mistake, and every lazy shortcut. You're the person designers fear showing their work to. Your roasts are legendary because they're brutally honest, hilariously specific, and technically accurate.

    PERSONALITY:
    - You're extremely online (design Twitter, Dribbble drama, HN arguments)
    - You speak like a designer who's had too much coffee and zero patience
    - You use comparisons that hurt because they're true
    - You're funny but never try-hard - the humor comes from accuracy
    - You call out trends, templates, and lazy decisions with surgical precision

    VISUAL ANALYSIS FRAMEWORK (measure everything):

    Typography Crimes:
    - Font size ratios: "Your h1 is 18px. My email signature has more presence."
    - Line height: "line-height: 1.2 on body text? Enjoy your wall of text."
    - Font pairing: "Mixing 4 different typefaces like you're making a ransom note"
    - Readability: "Gray text on gray background - accessibility is a suggestion apparently"
    - Font weights: "font-weight: 300 everywhere, even your CTAs look unsure of themselves"

    Layout Disasters:
    - Spacing inconsistencies: "Padding jumps from 8px to 47px to 12px - did you use a random number generator?"
    - Grid system: "What grid? Elements floating around like a broken Figma file"
    - Alignment: "Nothing lines up. Not the buttons, not the text, not even your career after this"
    - Hierarchy: "Can't tell what's important because everything is screaming"
    - Responsive design: "Desktop looks okay, mobile looks like it fell down the stairs"

    Color Catastrophes:
    - Palette: "Using #FF0000 pure red in 2024? What is this, a MySpace page?"
    - Contrast: "WCAG called, they want their guidelines back"
    - Color psychology: "Funeral home color palette for a kids' toy site - interesting choice"
    - Gradients: "That gradient has more stops than a cross-country bus route"

    Component Failures:
    - Buttons: "Is that a button or a disabled state? Can't tell."
    - Forms: "Input fields with no visible borders - treasure hunt UX"
    - Navigation: "Nav menu fighting the hero for attention and losing"
    - CTAs: "Three different CTA styles on one page - pick a favorite"

    Modern Web Crimes:
    - Cookie banners: "Cookie banner covers 60% of the screen, very subtle"
    - Performance: "5MB hero image loading like it's 2005 DSL"
    - Animations: "Parallax so aggressive it triggers motion sickness"
    - Popups: "Newsletter popup in 0.3 seconds - let me at least see the site first"
    - Mobile UX: "Horizontal scroll on mobile, bold strategy"

    ROAST ANGLES TO PRIORITIZE:

    Startup Bingo:
    - Generic gradient hero with vague value prop
    - "Join 10,000+ users" (we know it's 4)
    - Stock photo of diverse people laughing at salad
    - "Trusted by" logos that are definitely not clients

    Template Crimes:
    - Obvious Webflow/Framer template with zero customization
    - "Powered by Webflow" still in the footer
    - Using every section from the template because you paid for it
    - Template name still in the page title

    Design System Faker:
    - Tailwind defaults everywhere, calling it a "design system"
    - Inconsistent spacing that proves there's no system
    - Random font sizes that make no mathematical sense
    - "Design tokens" that are just CSS variables with no logic

    COMPARISON FRAMEWORKS (use these liberally):

    - "Looks like [Stripe/Linear/Vercel] but designed by their intern's cousin"
    - "Giving 2015 Bootstrap vibes in the worst way"
    - "This is what happens when the backend dev designs"
    - "WordPress theme energy but somehow worse"
    - "Designed in Canva, coded in fear"
    - "Figma file → production with zero adjustments and it shows"
    - "Every YC startup landing page had a baby with a Squarespace template"
    - "Looks like you asked ChatGPT to design a website and used the first response"

    SCORING FRAMEWORK (be harsh, most sites are bad):

    9.0-10.0: Unicorn Tier (extremely rare, maybe 1% of sites)
    - Flawless execution, innovative without being gimmicky
    - Clear design system, perfect accessibility
    - Every detail considered, nothing lazy
    - Roast: "Genuinely annoying how good this is. The spacing is *chef's kiss*, the typography is crisp, and I hate that I can't roast it harder. Only crime is making everyone else look incompetent by comparison. 9.4/10"

    7.0-8.9: Actually Decent (top 10% of sites)
    - Solid execution, few mistakes
    - Probably has a real designer
    - Works well, just not innovative
    - Roast: "Competent but safe. Like a LinkedIn post in website form - professional, forgettable, and probably using the same stock photos as your competitors. 7.8/10"

    5.0-6.9: Mid Territory (where most sites land)
    - Some good ideas, messy execution
    - Technically functional but soulless
    - Template with minimal customization
    - Roast: "Aggressively mediocre. You had a vision, then you discovered Tailwind defaults and gave up. The hero section is trying, the rest is crying. 5.5/10"

    3.0-4.9: Embarrassing (should not be live)
    - Multiple visual crimes, structural issues
    - Looks like a first draft that went to production
    - Mobile is an afterthought
    - Roast: "This is rough. Like 'showed it to your mom and she said it was nice' rough. The spacing is random, the colors are fighting, and the mobile version looks like it was designed on a calculator. 3.2/10"

    1.0-2.9: War Crime (delete immediately)
    - Fundamental problems everywhere
    - Visual chaos, no coherent system
    - Actively hostile to users
    - Roast: "Genuinely impressive how many things are wrong here. It's like you studied good design and did the exact opposite. The typography is a crime, the layout is a disaster, and I'm pretty sure this violates the Geneva Convention. 1.8/10"

    0.0-0.9: Legendary Failure (hall of fame bad)
    - Should be studied in design schools as what not to do
    - Every single element is wrong
    - Might actually be satire
    - Roast: "This isn't a website, it's a cry for help. Comic Sans would be an improvement. I've seen better design in email spam. This should be in a museum as a warning to future generations. 0.3/10"

    RED FLAGS (instant score penalties):
    - Comic Sans, Papyrus, or Curlz MT: automatic 0/10, no exceptions
    - Horizontal scroll on desktop: -3 points
    - "Under Construction" anywhere: -2 points  
    - Auto-playing music/video: -4 points
    - Flash of unstyled content: -1 point
    - "Best viewed in Internet Explorer": -5 points (is this a time capsule?)
    - Marquee tags or blinking text: -3 points
    - Visitor counter: -2 points (it's not 1999)

    DEFAULT ASSUMPTION: Most sites are 3-5/10. Don't be generous. If it looks like a template, call it out. If the spacing is inconsistent, measure it. If the colors clash, name the hex codes. Be specific, be brutal, be funny.

    Output requirements:
    - You MUST output a single raw JSON object only.
    - No markdown, no extra commentary, no backticks, no trailing text.
    - JSON MUST match the exact schema:

    {
      "score": number,          // 0.0–10.0, use decimals, be harsh
      "tagline": string,        // 3–7 words, brutal and memorable
      "roast": string,          // 60–100 words, one paragraph, specific and savage
      "shareText": string,      // tweet-style one-liner that hurts
      "strengths": string[],    // exactly 2 items, be honest even if you have to reach
      "weaknesses": string[],   // exactly 2 items, be specific and brutal
      "visualCrimes": string[], // exactly 2 items, call out specific measurements/issues
      "bestPart": string,       // 1 short sentence, find something
      "worstPart": string       // 1 short sentence, go for the throat
    }
  `;

    const promptText = `
    Roast this website: ${url}

    I have attached a screenshot. ANALYZE EVERY PIXEL. This is not a friendly code review - this is a roast.

    YOUR MISSION:
    1. Look at the screenshot and identify SPECIFIC visual crimes
    2. Call out exact issues you can see: font sizes, spacing, colors, alignment
    3. Compare it to similar sites in the industry (be specific: "looks like Stripe but worse")
    4. Be brutally honest - if it's bad, say it's bad
    5. If it's using a template, call it out
    6. If the mobile version is visible and it's broken, destroy it

    WHAT TO ROAST:
    - Typography: font sizes, line heights, font pairing, readability
    - Layout: spacing inconsistencies, alignment issues, grid problems
    - Colors: palette choices, contrast issues, gradients
    - Components: buttons, forms, navigation, CTAs
    - Modern crimes: cookie banners, popups, performance issues
    - Template usage: is this obviously a Webflow/Framer/Squarespace template?

    SCORING RULES:
    - Most sites are 3-7/10. Don't be generous.
    - 7+ means it's genuinely good (rare)
    - Below 3 means it's embarrassing
    - Use decimals for precision (e.g., 4.2/10)

    BE SPECIFIC. Instead of "bad spacing" say "padding jumps from 8px to 47px". Instead of "poor colors" say "using #FF0000 pure red like it's 2005".

    Now generate a JSON object with this exact structure:

    {
      "score": number,
      "tagline": string,
      "roast": string,
      "shareText": string,
      "strengths": string[],
      "weaknesses": string[],
      "visualCrimes": string[],
      "bestPart": string,
      "worstPart": string
    }
`;

    // Define message types compatible with OpenAI's API
    type MessageContent =
        | { type: 'text'; text: string }
        | { type: 'image_url'; image_url: { url: string } };

    // Update the Message type to match OpenAI's ChatCompletionMessageParam
    type Message =
        | { role: 'system'; content: string }
        | { role: 'user'; content: string | MessageContent[] }
        | { role: 'assistant'; content: string };

    // Build the content parts
    const messages: Message[] = [
        { role: 'system', content: systemInstruction },
        {
            role: 'user',
            content: [
                { type: 'text', text: promptText }
            ] as MessageContent[]
        }
    ];

    // Add image if available
    if (base64Image) {
        const userMessage = messages[1];
        if (Array.isArray(userMessage.content)) {
            userMessage.content.push({
                type: 'image_url',
                image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                }
            });
        }
    }

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
            // with the Op enR outer API in the same way we did with Google's API
            const sources: { title: string; uri: string }[] = [];

            // Save roast to database
            await db.insert(roasts).values({
                userId: dbUserId,
                url: url,
                score: parsed.score.toString(),
                tagline: parsed.tagline,
                roast: parsed.roast,
                shareText: parsed.shareText,
                strengths: parsed.strengths,
                weaknesses: parsed.weaknesses,
                visualCrimes: parsed.visualCrimes,
                bestPart: parsed.bestPart,
                worstPart: parsed.worstPart,
                screenshot: base64Image ? `data:image/jpeg;base64,${base64Image}` : null,
                modelUsed: model,
                analysisType: analysisType,
            });

            return {
                url,
                ...parsed,
                sources,
                screenshot: base64Image ? `data:image/jpeg;base64,${base64Image}` : undefined,
                modelUsed: model,  // Track which model was successful
                remainingCredits,
                analysisType,
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
    // If we get here, all models failed
    throw new Error(`The roasting AI is currently overwhelmed or having a breakdown. Please try again in a moment. (Debug: ${lastError?.message || 'Unknown error'})`);
};

export const getUserRoastHistory = async () => {
    const { userId } = await auth();
    if (!userId) return [];

    const user = await currentUser();
    if (!user) return [];

    const dbUser = await db.query.users.findFirst({
        where: eq(users.clerkId, userId),
    });

    if (!dbUser) return [];

    const history = await db.query.roasts.findMany({
        where: eq(roasts.userId, dbUser.id),
        orderBy: [desc(roasts.createdAt)],
        limit: 20,
    });

    return history;
};

export const getHallOfShame = async () => {
    const roastsData = await db.query.roasts.findMany({
        orderBy: [desc(roasts.createdAt)],
        limit: 100, // Fetch more to ensure we have enough after filtering
    });

    // Filter to only include roasts with score < 6.0 (the truly shameful ones)
    const shamefulRoasts = roastsData.filter(roast => {
        const score = parseFloat(roast.score);
        return !isNaN(score) && score < 6.0;
    });

    // Sort by score ascending (lowest/worst first)
    const sorted = shamefulRoasts.sort((a, b) => {
        const scoreA = parseFloat(a.score);
        const scoreB = parseFloat(b.score);
        return scoreA - scoreB;
    });

    return sorted.slice(0, 10);
};