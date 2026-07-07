import { NextResponse } from "next/server";
import mongoose from "mongoose"; 
import User from "@/lib/models/User";

export async function POST(req) {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const data = await req.json();
    const { 
      email, name, image, bio, mobileNumber, bioTheme,     
      banners, socialHandles, autodeal_active, autoDealCategories, 
      amazonTag, salesBoosterActive, isAmazonShortlinkEnabled
    } = data;

    // ==========================================
    // 🚀 1. AUTO-DELETE ENGINE (The Cleanup)
    // ==========================================
    const oldUser = await User.findOne({ email });

    if (oldUser) {
      // Step A: Collect all OLD image links from Profile & Banners
      const oldImages = [];
      if (oldUser.image) oldImages.push(oldUser.image);
      if (oldUser.banners && oldUser.banners.length > 0) {
        oldUser.banners.forEach(b => { if(b.image) oldImages.push(b.image) });
      }

      // Step B: Collect all NEW image links coming from frontend
      const newImages = [];
      if (image) newImages.push(image);
      if (banners && banners.length > 0) {
        banners.forEach(b => { if(b.image) newImages.push(b.image) });
      }

      // Step C: Find Orphaned Images (Jo purani me hain par nayi me nahi)
      const imagesToDelete = oldImages.filter(oldImg => !newImages.includes(oldImg));

      // Step D: Filter only Hostinger links (cb.metrovatech.com)
      const hostingerImagesToDelete = imagesToDelete.filter(img => img.includes("cb.metrovatech.com"));

      // Step E: Trigger Hostinger Deletion (Background task)
      if (hostingerImagesToDelete.length > 0) {
        hostingerImagesToDelete.forEach(imageUrl => {
          fetch('https://cb.metrovatech.com/delete-image.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              url: imageUrl, 
              secret: process.env.HOSTINGER_SECRET_KEY || "FavylinkSecret123" // Secure Key
            })
          }).catch(err => console.log("Hostinger Auto-Delete silent error:", err));
        });
      }
    }

    // ==========================================
    // 🚀 2. NORMAL DB UPDATE (Save New Data)
    // ==========================================
    const updatedUser = await User.findOneAndUpdate(
      { email: email },
      { 
        $set: { 
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
          salesBoosterActive,
          isAmazonShortlinkEnabled
        } 
      },
      { new: true }
    );

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}