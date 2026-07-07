import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("image");
    const type = formData.get("type"); // 'profile' or 'banner'

    if (!file) {
      return NextResponse.json({ success: false, error: "No image file provided" }, { status: 400 });
    }

    // 🎯 Optimization Rule: Profile ko JPG aur Banners ko WebP me convert karenge
    const targetFormat = type === "profile" ? "jpg" : "webp";
    const customFileName = `${type}_${Date.now()}`;

    // Hostinger API ke liye naya payload taiyar karein
    const hostingerPayload = new FormData();
    hostingerPayload.append("image", file);
    hostingerPayload.append("filename", customFileName);
    hostingerPayload.append("format", targetFormat);
    
    // 🛡️ SECRET KEY: Isko bad me .env me daal sakte hain
    hostingerPayload.append("secret", "FavylinkSecret123"); 

    // Hostinger image-hub server ko request forward karein
    const response = await fetch("https://cb.metrovatech.com/image-hub.php", {
      method: "POST",
      body: hostingerPayload,
    });

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Upload Route Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}