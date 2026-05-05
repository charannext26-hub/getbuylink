import { NextResponse } from "next/server";
import mongoose from "mongoose";
import PlatformConfig from "@/lib/models/PlatformConfig";

export async function GET() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    let config = await PlatformConfig.findOne({ configId: "master_config" });

    // Agar config nahi hai, toh ek Default JSON bhej do jisme naye features bhi hain
    if (!config) {
      return NextResponse.json({ 
        success: true, 
        data: { 
          topNotice: { isActive: false, text: "", linkUrl: "", bgColor: "bg-indigo-600" },
          globalPopup: { isActive: false, imageUrl: "", linkUrl: "" },
          banners: [], 
          storeSales: [], 
          topDealSections: [],
          extraSections: [],
          // 🚨 Naye Features Add kar diye
          vipStoreRates: { isActive: true },
          youtubeBanners: { isActive: true, videos: [] }
        } 
      });
    }

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Data fetch error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const updatedConfig = await PlatformConfig.findOneAndUpdate(
      { configId: "master_config" },
      { $set: body }, // 🚀 Yeh line automatically youtubeBanners aur vipStoreRates ko save kar legi
      { new: true, upsert: true }
    );

    return NextResponse.json({ 
      success: true, 
      message: "Platform settings saved successfully!", 
      data: updatedConfig 
    });

  } catch (error) {
    console.error("Admin POST Error:", error);
    return NextResponse.json({ success: false, message: "Update failed" }, { status: 500 });
  }
}