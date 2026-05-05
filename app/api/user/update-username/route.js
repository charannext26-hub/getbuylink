import { NextResponse } from "next/server";
import mongoose from "mongoose"; 
import User from "@/lib/models/User";

export async function POST(req) {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const { email, newUsername } = await req.json();

    // 1. Check karo ki naya username kisi aur ke paas toh nahi hai?
    const existingUser = await User.findOne({ username: newUsername });
    
    if (existingUser && existingUser.email !== email) {
      // Agar kisi aur ne liya hua hai, toh error de do!
      return NextResponse.json({ success: false, message: "Username already taken! Please choose another." }, { status: 400 });
    }

    // 2. Agar available hai, toh aaram se update kar do
    const updatedUser = await User.findOneAndUpdate(
      { email: email },
      { $set: { username: newUsername } },
      { new: true }
    );

    return NextResponse.json({ success: true, message: "Username updated successfully!" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}