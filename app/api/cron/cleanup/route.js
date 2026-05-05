import { NextResponse } from "next/server";
import mongoose from "mongoose";
import GlobalDeal from "@/lib/models/GlobalDeal";

export async function GET(req) {
  try {
    // Database Connect karna
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Aaj se 3 din pehle ka time calculate karna
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    // Delete Command: Jiska source 'telegram' ho AUR jo 3 din se purana ho
    const result = await GlobalDeal.deleteMany({
      source: "telegram",
      createdAt: { $lt: threeDaysAgo }
    });

    console.log(`🧹 Auto-Cleanup Done: ${result.deletedCount} old telegram deals deleted.`);

    return NextResponse.json({ 
      success: true, 
      message: `Safai ho gayi! ${result.deletedCount} deals udh gaye.`,
      deletedCount: result.deletedCount
    }, { status: 200 });

  } catch (error) {
    console.error("⛔ Cron Cleanup Error:", error.message);
    return NextResponse.json({ success: false, message: "Safai fail ho gayi!" }, { status: 500 });
  }
}