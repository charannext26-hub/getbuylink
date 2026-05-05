import mongoose from "mongoose";
import User from "@/lib/models/User";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username || username.length < 3) {
      return NextResponse.json({ available: false });
    }

    const blacklist = ["admin", "api", "login", "dashboard", "creators", "settings", "about", "privacy"];
    if (blacklist.includes(username.toLowerCase())) {
      return NextResponse.json({ available: false });
    }

    await mongoose.connect(process.env.MONGODB_URI);
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    
    return NextResponse.json({ available: !existingUser }); // True if not found
  } catch (error) {
    return NextResponse.json({ available: false });
  }
}