import { NextResponse } from "next/server";
import mongoose from "mongoose";
import GlobalDeal from "@/lib/models/GlobalDeal";
import LinkPerformance from "@/lib/models/LinkPerformance";
import User from "@/lib/models/User";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const dbUser = await User.findOne({ email: email });
    const creatorIdToCheck = email; 
    
    // 🚨 MASTER FIX: Yahan username ko clean kiya gaya hai taaki wo DB ke "creatorId" se exactly match kare!
    let username = "creator";
    if (dbUser && dbUser.username) {
        username = dbUser.username.replace(/[^a-zA-Z0-9]/g, '');
    } else {
        username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    }

    // IST Timezone Fix (Raat 12 baje India ke hisaab se)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; 
    const istTime = new Date(now.getTime() + istOffset);
    istTime.setUTCHours(0, 0, 0, 0); 
    const todayStart = new Date(istTime.getTime() - istOffset); 

    // ==========================================
    // 📊 BUCKET 1: OWN LINKS DATA
    // ==========================================
    const ownLinksTotal = await GlobalDeal.countDocuments({ creatorId: creatorIdToCheck, linkType: "own", source: "creator", createdAt: { $gte: todayStart } });
    const ownLinksVideo = await GlobalDeal.countDocuments({ creatorId: creatorIdToCheck, linkType: "own", source: "creator", videoUrl: { $ne: "", $exists: true }, createdAt: { $gte: todayStart } });
    const ownLinksCollection = await GlobalDeal.countDocuments({ creatorId: creatorIdToCheck, linkType: "own", source: "creator", collectionName: { $ne: "", $exists: true }, createdAt: { $gte: todayStart } });

    // ==========================================
    // 📊 BUCKET 2: PLATFORM LINKS DATA
    // ==========================================
    const platformLinksTotal = await GlobalDeal.countDocuments({ creatorId: creatorIdToCheck, linkType: "platform", source: "creator", createdAt: { $gte: todayStart } });
    const platformLinksVideo = await GlobalDeal.countDocuments({ creatorId: creatorIdToCheck, linkType: "platform", source: "creator", videoUrl: { $ne: "", $exists: true }, createdAt: { $gte: todayStart } });
    const platformLinksCollection = await GlobalDeal.countDocuments({ creatorId: creatorIdToCheck, linkType: "platform", source: "creator", collectionName: { $ne: "", $exists: true }, createdAt: { $gte: todayStart } });

    // Platform Clicks Query
    const platformPerformance = await LinkPerformance.find({ 
      creatorId: username, // 👈 Ab yahan clean naam jayega "nimaidharatest"
      linkType: "platform", 
      source: "manual",
      $or: [
        { lastClickedAt: { $gte: todayStart } },
        { updatedAt: { $gte: todayStart } }
      ]
    });
    const platformClicks = platformPerformance.reduce((sum, link) => sum + (link.clicks || 0), 0);

    // ==========================================
    // 📊 BUCKET 3: AUTO-POST DATA
    // ==========================================
    const telegramDealsTotal = await GlobalDeal.countDocuments({ source: "telegram", createdAt: { $gte: todayStart } });

    const autoPostPerformance = await LinkPerformance.find({ 
      creatorId: username, 
      source: { $in: ["telegram", "auto-post-share"] },
      createdAt: { $gte: todayStart }
    });
    const autoPostLinksGenerated = autoPostPerformance.length;
    
    const autoPostClicksPerformance = await LinkPerformance.find({ 
        creatorId: username, 
        source: { $in: ["telegram", "auto-post-share"] },
        $or: [
          { lastClickedAt: { $gte: todayStart } },
          { updatedAt: { $gte: todayStart } }
        ]
    });
    const autoPostClicks = autoPostClicksPerformance.reduce((sum, link) => sum + (link.clicks || 0), 0);

    // ==========================================
    // 🚀 FINAL RESPONSE
    // ==========================================
    return NextResponse.json({
      success: true,
      data: {
        ownStats: { total: ownLinksTotal, videoCount: ownLinksVideo, collectionCount: ownLinksCollection },
        platformStats: { total: platformLinksTotal, videoCount: platformLinksVideo, collectionCount: platformLinksCollection, clicks: platformClicks },
        autoPostStats: { totalTelegramDeals: telegramDealsTotal, linksGenerated: autoPostLinksGenerated, clicks: autoPostClicks }
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Dashboard Stats API Error:", error);
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}