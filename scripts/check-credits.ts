
import { db } from "../db";
import { users, transactions } from "../db/schema";
import { eq, desc } from "drizzle-orm";

async function main() {
    const allUsers = await db.query.users.findMany();
    console.log(`Found ${allUsers.length} users.`);

    for (const user of allUsers) {
        console.log(`User: ${user.email} (Clerk ID: ${user.clerkId})`);
        console.log(`Credits: ${user.credits}`);

        const userTransactions = await db.query.transactions.findMany({
            where: eq(transactions.userId, user.id),
            orderBy: [desc(transactions.createdAt)],
            limit: 5
        });

        console.log("Recent Transactions:");
        userTransactions.forEach(tx => {
            console.log(`  - ${tx.type}: ${tx.amount} (Order ID: ${tx.orderId})`);
        });
        console.log("---------------------------------------------------");
    }
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
