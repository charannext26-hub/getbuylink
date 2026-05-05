import { NextResponse } from "next/server";
import mongoose from "mongoose";
import GlobalDeal from "@/lib/models/GlobalDeal";
import User from "@/lib/models/User";
import LinkPerformance from "@/lib/models/LinkPerformance";

// 🚨 Next.js ko bolna padta hai ki is API ko cache na kare, hamesha fresh data de
export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    // 🚨 Database Connection
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ success: false, message: "Email required" }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found");

    // 🚨 MASTER FIX 1: Exact Username nikalna (Taaki DB match fail na ho)
    const username = user.username ? user.username.replace(/[^a-zA-Z0-9]/g, '') : email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');

    // Query by default sirf Auto-Post sources ko hi uthayegi!
    let query = {
      source: { $in: ["telegram", "auto-post-share"] }
    };

    if (user.autoDealCategories && user.autoDealCategories.length > 0) {
      query.category = { $in: user.autoDealCategories };
    }

    // 1. Fetch Deals aur .lean() lagaya
    const rawDeals = await GlobalDeal.find(query).sort({ createdAt: -1 }).limit(200).lean();

    if (rawDeals.length === 0) {
      return NextResponse.json({ success: true, deals: [] }, { status: 200 });
    }

    // ============================================================
    // 🚨 MASTER FIX 2: THE BULLETPROOF DEAL ID MATCHING 🚨
    // ============================================================
    
    const dealIds = [];
    const searchUrls = []; // Purane links (jinka ID save nahi hua tha) unke backup ke liye

    rawDeals.forEach(deal => {
      dealIds.push(deal._id.toString());
      if (deal.originalUrl) searchUrls.push(deal.originalUrl);
      if (deal.expandedUrl) searchUrls.push(deal.expandedUrl);
    });

    // DB se LinkPerformance uthao (ID ya URL dono se dhoondho)
    const linkPerformances = await LinkPerformance.find({
      creatorId: username, // 👈 Yahan exact username lagaya
      $or: [
        { globalDealId: { $in: dealIds } }, // Naya 100% accurate system
        { originalUrl: { $in: searchUrls } } // Purana backup system
      ]
    }).lean();

    // Fast mapping ke liye clickMap banao
    const clickMap = {};
    linkPerformances.forEach(lp => {
      // Agar ID hai toh usse save karo
      if (lp.globalDealId) {
        clickMap[lp.globalDealId.toString()] = Math.max(clickMap[lp.globalDealId.toString()] || 0, lp.clicks || 0);
      }
      // Backup ke liye URL se bhi save kar lo
      if (lp.originalUrl) {
        clickMap[lp.originalUrl] = Math.max(clickMap[lp.originalUrl] || 0, lp.clicks || 0);
      }
    });

    // 3. Har Deal ke andar uske clicks jod do
    const dealsWithClicks = rawDeals.map(deal => {
      const dealIdStr = deal._id.toString();
      
      // Pehle accurate ID se dekho, nahi toh URLs se (Jisme bhi value zyada ho)
      const clicksFromId = clickMap[dealIdStr] || 0;
      const clicksFromOrig = clickMap[deal.originalUrl] || 0;
      const clicksFromExp = clickMap[deal.expandedUrl] || 0;

      return {
        ...deal,
        clicks: Math.max(clicksFromId, clicksFromOrig, clicksFromExp) // Jo sabse badi value ho usko UI par bhej do
      };
    });
    
    // Final data frontend ko bhej do
    return NextResponse.json({ success: true, deals: dealsWithClicks }, { status: 200 });
  } catch (error) {
    console.error("Get Filtered API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}