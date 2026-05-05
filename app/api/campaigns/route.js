import { NextResponse } from "next/server";
import mongoose from "mongoose";
import StoreRate from "@/lib/models/StoreRate";

export async function GET() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Seedha Database se fetch karo (0.1 second load time!)
    const campaigns = await StoreRate.find({}).lean();

    return NextResponse.json({ 
        success: true, 
        campaigns: campaigns 
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message, campaigns: [] }, { status: 500 });
  }
}