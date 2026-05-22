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
      image, 
      bio, 
      mobileNumber, 
      bioTheme,     
      banners,         // 👈 NAYA: Ab ye objects ka array aayega [{image, link}]
      socialHandles,   // 👈 NAYA: Ab ye objects ka array aayega [{title, link}]
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
          banners,       // 👈 MongoDB naye objects ko direct yahan save kar lega
          socialHandles, // 👈 MongoDB naye objects ko direct yahan save kar lega
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