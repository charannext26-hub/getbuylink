import { NextResponse } from "next/server";
import mongoose from "mongoose"; 
import User from "@/lib/models/User";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ success: false, message: "Username missing" }, { status: 400 });
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // 🔒 DEEP HIDE: password, email, role, aur amazonTag ko frontend se block kiya
    const user = await User.findOne({ username: new RegExp(`^${username}$`, "i") })
                           .select("name username image bio socialHandles banners bioTheme salesBoosterActive -_id") 
                           .lean();

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: user, 
      cuelinksPubId: process.env.CUELINKS_PUB_ID 
    }, { status: 200 });

  } catch (error) {
    console.error("Fetch User API Error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}