import { NextResponse } from "next/server";
import mongoose from "mongoose";
import LinkPerformance from "@/lib/models/LinkPerformance";

export async function GET(req, { params }) {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // 1. URL se short code nikalo (jaise 'x7b9q2')
    const resolvedParams = await params;
    const shortCode = resolvedParams.shortCode; // ✅ 'params' ki jagah 'resolvedParams' aayega

    // 2. Database mein dhoondho ki yeh code kiska hai
    const linkData = await LinkPerformance.findOne({ shortCode: shortCode });

    if (!linkData) {
      return new NextResponse("Invalid or Expired Link!", { status: 404 });
    }

    // 3. Click count +1 kar do
    linkData.clicks += 1;
    linkData.lastClickedAt = new Date();
    await linkData.save();

    // 4. Seedha Cuelinks (Affiliate URL) par redirect kar do! 🚀
    return NextResponse.redirect(linkData.affiliateUrl, 302);

  } catch (error) {
    console.error("Shortlink Redirect Error:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}