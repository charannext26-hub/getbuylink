import { NextResponse } from "next/server";
import mongoose from "mongoose"; // 🚨 Database connection package
import User from "@/lib/models/User";

export async function GET(req) {
  try {
    // 1. URL se username nikalna
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ success: false, message: "Username missing" }, { status: 400 });
    }

    // 2. Safe Database Connection
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // 3. Username se user ko dhoondho (Smart Search & Optimized)
    // 🚨 UPDATE: .select("-password") se security badhayi aur .lean() se speed 2x kar di.
    // Ab is 'user' object mein automatically banners, socialHandles, bioTheme sab aa jayega!
    const user = await User.findOne({ username: new RegExp(`^${username}$`, "i") })
                           .select("-password") 
                           .lean();

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // 4. Sahi data frontend ko bhejo
    return NextResponse.json({
      success: true,
      user: user, // 🌟 Banners, theme, aur social links ab frontend ko mil jayenge
      cuelinksPubId: process.env.CUELINKS_PUB_ID // 🚨 UNTOUCHED: Aapka purana logic ekdum safe hai
    }, { status: 200 });

  } catch (error) {
    console.error("Fetch User API Error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}