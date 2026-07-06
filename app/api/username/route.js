import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import User from "@/lib/models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // 1. Check Login Session
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Please login first." }, { status: 401 });
    }

    // 2. Extract Data
    const { username, socialHandles, categories } = await req.json();
    const cleanUsername = username?.toLowerCase().trim();

    // 3. Strict Length Check (Min 6, Max 20)
    if (!cleanUsername || cleanUsername.length < 6 || cleanUsername.length > 20) {
      return NextResponse.json({ error: "Username must be exactly between 6 and 20 characters." }, { status: 400 });
    }

    // 4. Strict Regex Validation (No underscores or special characters)
    const regex = /^[a-z0-9]+$/;
    if (!regex.test(cleanUsername)) {
      return NextResponse.json({ error: "Username can only contain English letters (a-z) and numbers (0-9)." }, { status: 400 });
    }

    // 5. THE COMPLETE BLACKLIST
    const blacklist = [
      "admin", "api", "login", "signup", "campaign", "campaigns", "terms", "term", 
      "disclosure", "username", "user", "users", "support", "deal", "offer", "cron", 
      "dashboard", "creators", "creator", "influencer", "settings", "about", 
      "privacypolicy", "privacy", "home", "search", "explore", "official", "favylink", "system"
    ];
    if (blacklist.includes(cleanUsername)) {
      return NextResponse.json({ error: "This username is reserved by system. Please choose another." }, { status: 400 });
    }

    // 6. Connect DB
    await mongoose.connect(process.env.MONGODB_URI);

    // 7. Check Availability in DB
    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) {
      return NextResponse.json({ error: "This username is already taken! Please try another." }, { status: 400 });
    }

    // 8. Prepare DB Update
    let setFields = { 
      username: cleanUsername 
    };

    if (categories && categories.length > 0) {
      setFields.nicheCategories = categories;
    }

    let updateOperation = { $set: setFields };

    if (socialHandles && socialHandles.length > 0) {
      updateOperation.$addToSet = { socialHandles: { $each: socialHandles } }; 
    }

    // 9. Final Update in MongoDB
    await User.findOneAndUpdate(
      { email: session.user.email }, 
      updateOperation
    );

    return NextResponse.json({ success: true, message: "Your page is ready! Redirecting... 🚀" });

  } catch (error) {
    console.log("Username save error:", error);
    return NextResponse.json({ error: "Server error, please try again later." }, { status: 500 });
  }
}