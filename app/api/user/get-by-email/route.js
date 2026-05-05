import { NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/lib/models/User";

export async function GET(req) {
  try {
    if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI);
    
    const email = new URL(req.url).searchParams.get("email");
    if (!email) return NextResponse.json({ success: false, message: "Email required" });

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ success: false, message: "User not found" });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}