import { NextResponse } from "next/server";
import mongoose from "mongoose";
import GlobalDeal from "@/lib/models/GlobalDeal";
import LinkPerformance from "@/lib/models/LinkPerformance";

export async function GET(req) {
  try {
    // 1. Safe DB Connection
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // 2. URL se Details Nikalna
    const { searchParams } = new URL(req.url);
    const dealId = searchParams.get("dealId");
    const creatorUsername = searchParams.get("creator");

    if (!dealId || !creatorUsername) {
      return new NextResponse("Missing information in link", { status: 400 });
    }

    // 3. Deal Dhoondho
    const deal = await GlobalDeal.findById(dealId);
    if (!deal) {
      return new NextResponse("Deal expired or not found", { status: 404 });
    }

    // 🚨 NAYA FIX: Aapke DB ke hisaab se sahi variables!
    // Pehle 'expandedUrl' try karega, agar wo khaali hua toh 'originalUrl' (short link) uthayega
    const targetProductUrl = deal.expandedUrl;

    if (!targetProductUrl) {
      return new NextResponse(`Oops! Product Link missing in Database.`, { status: 400 });
    }

    // 4. Fly mein Cuelinks Link Banao
    const pubId = process.env.CUELINKS_PUB_ID || "246005"; 
    const finalAffiliateUrl = `https://linksredirect.com/?cid=${pubId}&source=linkkit&subid=${creatorUsername}&url=${encodeURIComponent(targetProductUrl)}`;

    // 5. UPSERT MAGIC: Clicks Record Karo!
    await LinkPerformance.findOneAndUpdate(
      { creatorId: creatorUsername, affiliateUrl: finalAffiliateUrl },
      {
        $inc: { clicks: 1 },
        $set: {
          lastClickedAt: new Date(),
          subId: creatorUsername,
          originalUrl: targetProductUrl, // Yahan DB mein Asli link save hoga tracking ke liye
          title: deal.title,
          store: deal.store || "Unknown",
          source: "auto-post-share",
          linkType: "platform"
        }
      },
      { upsert: true, new: true }
    );

    // 6. User ko Product par bhej do! 🚀
    return NextResponse.redirect(finalAffiliateUrl);

  } catch (error) {
    console.error("Redirect Error:", error);
    return new NextResponse("Server Error during redirect", { status: 500 });
  }
}