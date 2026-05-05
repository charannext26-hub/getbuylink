import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import User from "@/lib/models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // 1. Check karein ki user login hai ya nahi
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Please login first." }, { status: 401 });
    }

    // 2. 🚨 NAYA: Frontend se bheje gaye ARRAYS pakdein
    const { username, socialHandles, categories } = await req.json();

    // Basic length check
    if (!username || username.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters long." }, { status: 400 });
    }

    // 3. THE BLACKLIST
    const blacklist = ["admin", "api", "login", "dashboard", "creators", "settings", "about", "privacy", "home", "search", "explore"];
    if (blacklist.includes(username.toLowerCase())) {
      return NextResponse.json({ error: "This username is reserved. Please choose another." }, { status: 400 });
    }

    // 4. Strict Regex Validation (Sirf letters, numbers aur underscore)
    const regex = /^[a-zA-Z0-9_]+$/;
    if (!regex.test(username)) {
      return NextResponse.json({ error: "Username can only contain letters, numbers, and underscores (_)." }, { status: 400 });
    }

    // 5. Database connect karein
    await mongoose.connect(process.env.MONGODB_URI);

    // 6. Check karein ki kya yeh username taken hai
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: "This username is already taken! Please try another." }, { status: 400 });
    }

    // 7. 🚨 SMART DB UPDATE PREPARATION
    let setFields = { 
      username: username.toLowerCase() 
    };

    // Agar user ne categories select ki hain, toh naye 'nicheCategories' field mein daalo
    if (categories && categories.length > 0) {
      setFields.nicheCategories = categories;
    }

    let updateOperation = { $set: setFields };

    // Agar user ne social links dale hain, toh array mein push (add) karo
    if (socialHandles && socialHandles.length > 0) {
      updateOperation.$addToSet = { socialHandles: { $each: socialHandles } }; 
    }

    // 8. Final DB Update (Ek hi baar mein sab save)
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