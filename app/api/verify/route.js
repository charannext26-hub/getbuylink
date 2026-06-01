import { NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/lib/models/User"; 

export async function GET(req) {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      // 👇 NAYA: Bulletproof Redirect (Bina env variable ke)
      return NextResponse.redirect(new URL("/login?error=InvalidLink", req.url));
    }

    const user = await User.findOne({ email, verifyToken: token });

    if (!user) {
      return NextResponse.redirect(new URL("/login?error=UserNotFound", req.url));
    }

    if (user.verifyTokenExpiry < Date.now()) {
      return NextResponse.redirect(new URL("/login?error=TokenExpired", req.url));
    }

    // SUCCESS!
    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpiry = undefined;
    
    await user.save();

    // 👇 NAYA: Bulletproof Redirect to Login
    return NextResponse.redirect(new URL("/login?verified=true", req.url));

  } catch (error) {
    console.error("Verification Error:", error);
    return NextResponse.redirect(new URL("/login?error=ServerError", req.url));
  }
}
