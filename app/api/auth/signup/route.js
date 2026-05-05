import { NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    // 1. Database Connect Karein
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const { name, email, password } = await req.json();

    // 2. Validation
    if (!email || !password || !name) {
      return NextResponse.json({ success: false, message: "All fields are required." }, { status: 400 });
    }

    // 3. Check karein ki user pehle se toh nahi hai
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ success: false, message: "Email is already registered. Please sign in." }, { status: 400 });
    }

    // 4. Password ko secure (Hash) karein
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Naya User Database mein save karein
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "creator" // Default role
    });

    return NextResponse.json({ success: true, message: "Account created successfully!" }, { status: 201 });

  } catch (error) {
    console.error("Signup Error:", error);
    return NextResponse.json({ success: false, message: "Server error occurred." }, { status: 500 });
  }
}