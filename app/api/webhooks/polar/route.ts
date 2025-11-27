import { validateEvent } from "@polar-sh/sdk/webhooks";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { addCreditsToUser } from "@/app/actions";

// Map Product IDs to Credit Amounts
const PRODUCT_CREDITS_MAP: Record<string, number> = {
    "471aae7a-10a5-4d4a-9b4c-3f5cab2210e7": 15,
    "157b126c-4ff9-4c7c-aced-5331a7834cd5": 40,
};

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("Polar-Webhook-Signature");
    const secret = process.env.POLAR_WEBHOOK_SECRET;

    if (!signature || !secret) {
        return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
    }

    try {
        const event = validateEvent(body, headersList as any, secret) as any;
        console.log(`Received Polar Webhook: ${event.type}`);

        if (event.type === "checkout.created") {
            return NextResponse.json({ received: true });
        }

        if (event.type === "order.created") {
            const order = event.data;
            console.log("Processing order.created:", JSON.stringify(order, null, 2));

            // Idempotency Check
            const existingTx = await db.query.transactions.findFirst({
                where: eq(transactions.orderId, order.id),
            });

            if (existingTx) {
                console.log(`Order ${order.id} already processed.`);
                return NextResponse.json({ message: "Event already processed" }, { status: 200 });
            }

            // Get Product ID
            const productId = order.product_id || order.product?.id;
            if (!productId) {
                console.error("Order missing product info (product_id or product.id)");
                return NextResponse.json({ message: "No product info" }, { status: 200 });
            }

            const creditAmount = PRODUCT_CREDITS_MAP[productId];
            console.log(`Product ID: ${productId}, Credit Amount: ${creditAmount}`);

            if (!creditAmount) {
                console.warn(`Unknown product ID: ${productId}. Available IDs: ${Object.keys(PRODUCT_CREDITS_MAP).join(", ")}`);
                return NextResponse.json({ message: "Unknown product" }, { status: 200 });
            }

            // Get User ID
            const userId = order.metadata?.userId || order.customer?.metadata?.userId;

            // If userId found in metadata
            if (userId) {
                console.log(`Found user ID in metadata: ${userId}`);
                const user = await db.query.users.findFirst({
                    where: eq(users.clerkId, userId.toString()),
                });

                if (user) {
                    try {
                        await addCreditsToUser(user.clerkId, creditAmount, order.id);
                        console.log(`Successfully updated credits for user ${user.clerkId}. Added ${creditAmount} credits.`);
                        return NextResponse.json({ received: true });
                    } catch (error) {
                        console.error("Failed to update user credits via addCreditsToUser:", error);
                        throw error;
                    }
                } else {
                    console.warn(`User not found for clerkId: ${userId}. Credits not added.`);
                    // Fallback to email if user not found by ID (e.g. if ID was wrong)
                }
            }

            // Fallback: Look up by email
            console.log("No valid userId in metadata or user not found, falling back to email...");
            const customerEmail = order.customer?.email || order.email; // Check both locations

            if (customerEmail) {
                console.log(`Looking up user by email: ${customerEmail}`);
                const user = await db.query.users.findFirst({
                    where: eq(users.email, customerEmail),
                });

                if (user) {
                    await addCreditsToUser(user.clerkId, creditAmount, order.id);
                    console.log(`Successfully updated credits for user ${user.clerkId} (via email). Added ${creditAmount} credits.`);
                    return NextResponse.json({ received: true });
                } else {
                    console.warn(`User not found for email: ${customerEmail}. Credits not added.`);
                    return NextResponse.json({ message: `User not found for email: ${customerEmail}` }, { status: 404 });
                }
            } else {
                console.warn("No userId in metadata and no customer email found. Credits not added.");
                return NextResponse.json({ message: "No user identifier found" }, { status: 400 });
            }
        }

        return NextResponse.json({ received: true });
    } catch (err) {
        console.error("Webhook verification failed:", err);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
}
