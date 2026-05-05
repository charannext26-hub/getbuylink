import { NextResponse } from "next/server";
import mongoose from "mongoose";
import GlobalDeal from "@/lib/models/GlobalDeal";
import User from "@/lib/models/User"; 
import LinkPerformance from "@/lib/models/LinkPerformance";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // 🚨 Exact username fetch
    const dbUser = await User.findOne({ email: email });
    const username = dbUser && dbUser.username ? dbUser.username.replace(/[^a-zA-Z0-9]/g, '') : email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');

    const rawDeals = await GlobalDeal.find({ creatorId: email, source: "creator" }).lean();

    if (rawDeals.length === 0) {
      return NextResponse.json({ success: true, data: { platform: [], own: [] } });
    }

    // ============================================================
    // 🚨 MASTER FIX: MATCH BY SHORTCODE 🚨
    // ============================================================
    
    // DB se dono cheezein nikal lo (Shortcodes aur URLs)
    const shortCodes = rawDeals.map(deal => deal.shortCode).filter(Boolean); // Sirf valid shortcodes
    const originalUrls = rawDeals.map(deal => deal.originalUrl).filter(Boolean);

    // Ab LinkPerformance mein ya toh Shortcode se dhoondho, ya fir original URL se (Backup)
    const linkPerformances = await LinkPerformance.find({ 
      creatorId: username,
      source: "manual",
      $or: [
        { shortCode: { $in: shortCodes } }, // 👈 100% Accurate Match
        { originalUrl: { $in: originalUrls } } // 👈 Purane links ke liye backup
      ]
    }).lean();

    const shortCodeMap = {};
    const clickMap = {}; 
    
    linkPerformances.forEach(lp => {
      // Backup: Agar GlobalDeal mein shortCode miss ho gaya tha
      if (lp.originalUrl && lp.shortCode) {
        shortCodeMap[lp.originalUrl] = lp.shortCode;
      }
      
      // Fast Clicks Mapping: Shortcode aur URL dono ke naam par clicks save kar lo
      if (lp.shortCode) {
        clickMap[lp.shortCode] = Math.max(clickMap[lp.shortCode] || 0, lp.clicks || 0);
      }
      if (lp.originalUrl) {
        clickMap[lp.originalUrl] = Math.max(clickMap[lp.originalUrl] || 0, lp.clicks || 0);
      }
    });

    // Ab deals ke andar exact clicks daal do
    const dealsWithDetails = rawDeals.map(deal => {
      // Pehle Shortcode se check karo, nahi mila toh URL se (Jisme bhi value zyada ho)
      const clicksFromShortCode = deal.shortCode ? (clickMap[deal.shortCode] || 0) : 0;
      const clicksFromUrl = deal.originalUrl ? (clickMap[deal.originalUrl] || 0) : 0;

      return {
        ...deal,
        shortCode: deal.shortCode || shortCodeMap[deal.originalUrl] || null,
        clicks: Math.max(clicksFromShortCode, clicksFromUrl) // 👈 Best Click Record bhejega
      };
    });

    // ============================================================

    const groupDeals = (dealsArray) => {
      const grouped = [];
      const batchTracker = {};

      dealsArray.forEach(deal => {
        if (deal.batchId && deal.batchId.trim() !== "") {
          if (!batchTracker[deal.batchId]) {
            batchTracker[deal.batchId] = {
              isBatch: true,
              batchId: deal.batchId,
              collectionName: deal.collectionName || "Collection",
              videoUrl: deal.videoUrl || "",
              totalClicks: 0,
              deals: [] 
            };
            grouped.push(batchTracker[deal.batchId]);
          }
          batchTracker[deal.batchId].deals.push(deal);
          batchTracker[deal.batchId].totalClicks += (deal.clicks || 0); // Collection clicks add hote jayenge
        } else {
          grouped.push({
            isBatch: false,
            deal: deal
          });
        }
      });

      return grouped.reverse(); 
    };

    const platformDeals = groupDeals(dealsWithDetails.filter(d => d.linkType === "platform"));
    const ownDeals = groupDeals(dealsWithDetails.filter(d => d.linkType === "own"));

    return NextResponse.json({ 
      success: true, 
      data: {
        platform: platformDeals, 
        own: ownDeals 
      } 
    }, { status: 200 });

  } catch (error) {
    console.error("Get Manual Deals Error:", error);
    return NextResponse.json({ success: false, message: "Server Error", error: error.message }, { status: 500 });
  }
}