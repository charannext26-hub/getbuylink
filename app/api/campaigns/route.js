import { NextResponse } from "next/server";
import mongoose from "mongoose";
import StoreRate from "@/lib/models/StoreRate";

export async function GET() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // 🚨 NAYA LOGIC: .sort({ name: 1 }) lagane se hamesha A to Z sorted aayega!
    const campaigns = await StoreRate.find({ isHidden: { $ne: true } })
                                     .sort({ name: 1 }) // 1 means Ascending (A-Z)
                                     .lean();

    return NextResponse.json({ 
        success: true, 
        campaigns: campaigns 
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message, campaigns: [] }, { status: 500 });
  }
}