import { NextResponse } from "next/server";
import mongoose from "mongoose"; 
import User from "@/lib/models/User";

export async function POST(req) {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const { 
      email, 
      name, 
      image, // Profile image URL update karne ke liye
      bio, 
      mobileNumber, // 🚨 NAYA
      bioTheme,     // 🚨 NAYA
      banners, 
      socialHandles, 
      autodeal_active, 
      autoDealCategories, 
      amazonTag,
      salesBoosterActive
    } = await req.json();

    const updatedUser = await User.findOneAndUpdate(
      { email: email },
      { 
        $set: { 
          // Email aur Username intentionally missing hain taaki over-write na ho!
          name, 
          image,
          bio, 
          mobileNumber,
          bioTheme,
          banners, 
          socialHandles, 
          autodeal_active, 
          autoDealCategories, 
          amazonTag,
          salesBoosterActive
        } 
      },
      { new: true }
    );

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}