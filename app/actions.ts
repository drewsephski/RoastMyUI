/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
        console.log("Starting captureScreenshot for URL:", url);
        console.log("NODE_ENV:", process.env.NODE_ENV);
        console.log("VERCEL:", process.env.VERCEL);
        console.log("POLAR_ACCESS_TOKEN present:", !!process.env.POLAR_ACCESS_TOKEN);
        console.log("NEXT_PUBLIC_APP_URL present:", !!process.env.NEXT_PUBLIC_APP_URL);
        console.log("API_KEY present:", !!process.env.API_KEY);
        console.log("OPENROUTER_API_KEY present:", !!process.env.OPENROUTER_API_KEY);


        // Normalize and validate URL
        const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
        try {
            new URL(normalizedUrl);
        } catch {
            console.error("Invalid URL format:", url);
            return null;
        }

        let browser;
        try {
            if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
                process.env.PUPPETEER_CACHE_DIR = '/tmp'; // Set cache directory for serverless environments
                const executablePath = await chromium.executablePath();
                console.log("Chromium executablePath:", executablePath);
                console.log("Launching Chromium for production/Vercel...");
                browser = await puppeteerCore.launch({
                    args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
                    executablePath: executablePath,
                    headless: true,
                });
            } else {
                console.log("Launching local Puppeteer for development...");
                const { default: puppeteer } = await import("puppeteer");
                browser = await puppeteer.launch({
                    headless: true,
                    args: ["--no-sandbox", "--disable-setuid-sandbox"],
                });
            }
            console.log("Browser launched successfully.");
        } catch (launchError) {
            console.error("Failed to launch browser:", launchError);
            throw launchError; // Re-throw to be caught by the outer catch
        }

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        
        try {
            console.log("Navigating to URL:", normalizedUrl);
            await page.goto(normalizedUrl, { waitUntil: "networkidle0", timeout: 30000 });
            console.log("Navigation successful.");
        } catch (gotoError) {
            console.error("Failed to navigate to URL:", gotoError);
            throw gotoError; // Re-throw to be caught by the outer catch
        }

        const base64 = await page.screenshot({ encoding: "base64", type: "jpeg", quality: 80 });
        console.log(`Screenshot base64 size: ${base64 ? base64.length : 0} bytes`);
        await browser.close();
        console.log("Browser closed.");
        return base64 as string;
    } catch (error) {
        console.error("Screenshot capture failed:", error);
        return null;
    }
};

// Define a list of models to try in order of preference
const MODEL_FALLBACK_CHAIN = [
    "openai/gpt-4o-mini",           // Fallback: Very cheap, good vision
    "anthropic/claude-3-haiku",     // Fallback: Reliable vision model
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

    if (!base64Image) {
        throw new Error("Failed to capture screenshot. Cannot roast without visual evidence.");
    }

    const systemInstruction = `
    You are an extremely online designer who's seen it all. You speak naturally, not like a corporate brand trying to be relatable. Think design Twitter meets Twitch chat - clever, specific, and unhinged.

    Your references are current and organic:
    - You notice when sites look like "every YC startup landing page"
    - You call out "Figma file → production with zero adjustments" energy
    - You reference actual design trends (brutalism, glassmorphism gone wrong, bento grids)
    - You use humor that lands, not slang that feels dated by the time you type it

    WHAT TO ANALYZE (prioritize visual crimes you can SEE):

    Typography:
    - Font size ratios (is the h1 actually bigger than body text?)
    - Line height (cramped = instant L)
    - Font pairing (are they using 4 different typefaces for no reason?)
    - Readability contrast

    Layout:
    - White space distribution (claustrophobic vs too sparse)
    - Grid system (or lack thereof)
    - Alignment issues (buttons not lining up, random padding)
    - Section hierarchy (can you tell what's important?)

    Color:
    - Palette coherence (does it look intentional?)
    - Contrast ratios (can you actually read the text?)
    - Color psychology match (fun brand with funeral home colors?)

    Components:
    - Button states (do they look clickable?)
    - Form fields (do they look interactive?)
    - Navigation (is it fighting for attention or invisible?)
    - CTAs (competing for attention or working together?)

    Modern Crimes:
    - Cookie banner that blocks the entire screen
    - Auto-playing video that tanks performance
    - "Scroll down" animation that's condescending
    - Parallax that makes you seasick
    - Modal popup within 0.5 seconds of landing

    SCORING FRAMEWORK (use decimals for precision):

    9.0-10.0: Genuinely impressive
    - Clear visual hierarchy, cohesive design system
    - Thoughtful details, good accessibility
    - Roast should be begrudging respect + tiny nitpicks
    - Example: "honestly annoying how clean this is, the spacing is *chef's kiss*, I hate that I can't roast it harder. Only crime is making everyone else look bad. 9.2/10"

    7.0-8.9: Solid but unremarkable
    - Does the job, no major crimes
    - Probably using a decent template correctly
    - Roast: acknowledge it works but point out where it plays it safe
    - Example: "competent but corporate, like a LinkedIn post in website form"

    5.0-6.9: Mid territory
    - Some good ideas, messy execution
    - Or: technically fine but soulless
    - Roast: point out the gap between ambition and reality

    3.0-4.9: Rough
    - Multiple visual crimes, but structure exists
    - Looks like a first draft
    - Roast: specific callouts of what's broken

    0.0-2.9: Disaster
    - Fundamental problems, hard to use
    - Visual chaos, no coherent system
    - Roast: surgical precision on everything wrong

    ADAPT YOUR ROAST TO THE SITE TYPE:

    SaaS/Tech:
    - They all look the same (gradient heroes, sans-serif, blue buttons)
    - Call out when they're trying too hard to look "innovative"
    - Notice if the product screenshots are more designed than the actual site

    Agency/Portfolio:
    - Should be showing off, so bar is higher
    - Roast the gap between their client work and their own site
    - Notice if they're doing "design trends" instead of good design

    E-commerce:
    - Product photos should be the star - are they?
    - Is the checkout flow obvious or playing hide and seek?
    - Loading speed matters 10x more here

    Personal/Blog:
    - Should have personality - does it?
    - Readability is king - is the text comfortable?
    - Is it trying to be a magazine but lacking the polish?

    Output requirements:
    - You MUST output a single raw JSON object only.
    - No markdown, no extra commentary, no backticks, no trailing text.
    - JSON MUST match the exact schema:

    {
      "score": number,          // 0.0–10.0, use decimals
      "tagline": string,        // 3–7 words, brutal summary
      "roast": string,          // 50–90 words, one paragraph, highly opinionated and specific
      "shareText": string,      // short tweet-style one-liner + URL placeholder
      "strengths": string[],    // exactly 2 items
      "weaknesses": string[],   // exactly 2 items
      "visualCrimes": string[], // exactly 2 items, specific visual issues
      "bestPart": string,       // 1 short sentence
      "worstPart": string       // 1 short sentence
    }
  `;

    const promptText = `
    Roast this website: ${url}

    I have attached a screenshot of the homepage as a base64 image. LOOK. AT. IT. Call out specific visual crimes: spacing, alignment, colors, typography, layout, hero section, nav size, buttons, and any random nonsense you see.

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