import mongoose from "mongoose";
import User from "@/lib/models/User";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username')?.toLowerCase().trim();

    // 1. Basic check & Strict Length Check (Min 6, Max 20)
    if (!username || username.length < 6 || username.length > 20) {
      return NextResponse.json({ available: false, error: "Must be between 6 and 20 characters." });
    }

    // 2. Strict Regex Validation (Sirf lowercase letters aur numbers)
    const regex = /^[a-z0-9]+$/;
    if (!regex.test(username)) {
      return NextResponse.json({ available: false, error: "Only letters and numbers allowed." });
    }

    // 3. COMPLETE SYSTEM BLACKLIST
    const blacklist = [
      "admin", "api", "login", "signup", "campaign", "campaigns", "terms", "term", 
      "disclosure", "username", "user", "users", "support", "deal", "offer", "cron", 
      "dashboard", "creators", "creator", "influencer", "settings", "about", 
      "privacypolicy", "privacy", "home", "search", "explore", "official", "favylink", "system"
    ];
    
    if (blacklist.includes(username)) {
      return NextResponse.json({ available: false, error: "Reserved username." });
    }

    // 4. Database Lookup
    await mongoose.connect(process.env.MONGODB_URI);
    const existingUser = await User.findOne({ username: username });
    
    return NextResponse.json({ available: !existingUser }); // True if not found in DB
  } catch (error) {
    return NextResponse.json({ available: false, error: "Server error" }, { status: 500 });
  }
}