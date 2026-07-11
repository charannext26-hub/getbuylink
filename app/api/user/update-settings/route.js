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
    // 🚀 1. SMART AUTO-DELETE ENGINE
    // ==========================================
    const oldUser = await User.findOne({ email });

    if (oldUser) {
      // Step A: Collect all OLD image links (Safely Trimmed & Filtered)
      const oldImages = [];
      if (oldUser.image && typeof oldUser.image === 'string') oldImages.push(oldUser.image.trim());
      if (oldUser.banners && oldUser.banners.length > 0) {
        oldUser.banners.forEach(b => { 
          if(b.image && typeof b.image === 'string') oldImages.push(b.image.trim());
        });
      }

      // Step B: Collect all NEW image links coming from frontend
      const newImages = [];
      
      // 🛑 SAFETY GUARD 1: Agar frontend ne image field bheja hi nahi (undefined), toh purana hi manlo
      if (image !== undefined && image !== null && typeof image === 'string') {
          newImages.push(image.trim());
      } else if (oldUser.image) {
          newImages.push(oldUser.image.trim()); // Purana save rakho, delete mat hone do!
      }

      // 🛑 SAFETY GUARD 2: Banners ke sath bhi wahi safety
      if (banners !== undefined && Array.isArray(banners)) {
          banners.forEach(b => { 
            if(b.image && typeof b.image === 'string') newImages.push(b.image.trim());
          });
      } else if (oldUser.banners && oldUser.banners.length > 0) {
          oldUser.banners.forEach(b => { 
            if(b.image && typeof b.image === 'string') newImages.push(b.image.trim());
          });
      }

      // Step C: Find TRUE Orphaned Images (Strict Space-Free Matching)
      const imagesToDelete = oldImages.filter(oldImg => {
        // Agar naye array me ye exact URL nahi hai, tabhi delete hoga
        return !newImages.includes(oldImg);
      });

      // Step D: Filter only Hostinger links
      const hostingerImagesToDelete = imagesToDelete.filter(img => img.includes("cb.metrovatech.com"));

      // Step E: Trigger Hostinger Deletion
      if (hostingerImagesToDelete.length > 0) {
        await Promise.all(
          hostingerImagesToDelete.map(async (imageUrl) => {
            try {
              await fetch('https://cb.metrovatech.com/delete-image.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  url: imageUrl, 
                  secret: process.env.HOSTINGER_SECRET_KEY || "FavylinkSecret123" 
                })
              });
            } catch (err) {
              console.log("Hostinger Auto-Delete error:", err);
            }
          })
        );
      }
    }

    // ==========================================
    // 🚀 2. NORMAL DB UPDATE (Save New Data)
    // ==========================================
    const updatedUser = await User.findOneAndUpdate(
      { email: email },
      { 
        $set: { 
          name, image, bio, mobileNumber, bioTheme, banners, 
          socialHandles, autodeal_active, autoDealCategories, 
          amazonTag, salesBoosterActive, isAmazonShortlinkEnabled
        } 
      },
      { returnDocument: 'after' } 
    );

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}