import { NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/lib/models/User"; // Path check kar lena

export async function GET(req) {
  try {
    // 1. Database Connect Karein
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // 2. URL se Token aur Email nikalein
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    const baseUrl = process.env.NEXTAUTH_URL || "http://favylink.com";

    if (!token || !email) {
      return NextResponse.redirect(`${baseUrl}/login?error=InvalidLink`);
    }

    // 3. Database mein us User ko dhoondein jiska email aur token match ho
    const user = await User.findOne({ email, verifyToken: token });

    if (!user) {
      return NextResponse.redirect(`${baseUrl}/login?error=UserNotFound`);
    }

    // 4. Check karein ki Token expire toh nahi ho gaya (1 ghante ka time tha)
    if (user.verifyTokenExpiry < Date.now()) {
      return NextResponse.redirect(`${baseUrl}/login?error=TokenExpired`);
    }

    // 5. SUCCESS! User ko verify karein aur token hata dein
    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpiry = undefined;
    
    // Changes save karein
    await user.save();

    // 6. User ko Login page par redirect karein ek Success Message ke sath
    return NextResponse.redirect(`${baseUrl}/login?verified=true`);

  } catch (error) {
    console.error("Verification Error:", error);
    const baseUrl = process.env.NEXTAUTH_URL || "http://favylink.com";
    return NextResponse.redirect(`${baseUrl}/login?error=ServerError`);
  }
}
