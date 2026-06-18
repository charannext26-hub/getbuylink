import { NextResponse } from "next/server";
import mongoose from "mongoose";
import GlobalDeal from "@/lib/models/GlobalDeal";
import User from "@/lib/models/User"; 

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    
    // 🚀 INCOMING TUNING: Frontend ab username bhejega, email nahi
    const username = searchParams.get("username"); 
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20; 
    const skip = (page - 1) * limit;
    const tab = searchParams.get("tab") || "home"; 

    if (!username) return NextResponse.json({ success: false, message: "Username required" }, { status: 400 });
    if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI);

    // 🖧 THE INVISIBLE BRIDGE: Username se creator ka internal check nikalna
    const creatorProfile = await User.findOne({ username: new RegExp(`^${username}$`, "i") }).lean();
    if (!creatorProfile) return NextResponse.json({ success: false, message: "Creator profile mismatch" }, { status: 404 });

    // Hacking match token: Data logic match karne ke liye internal email variable nikal liya
    const email = creatorProfile.email;

    // Tab ke hisaab se Query Engine (Remains 100% untouched & perfectly mapped)
    let matchQuery = { $or: [{ creatorId: email, source: "creator" }, { source: "telegram" }] };
    let sortQuery = { createdAt: -1 };

    if (tab === "home" || tab === "categories") {
        matchQuery = { creatorId: email, source: "creator" }; 
    } else if (tab === "trending") {
        matchQuery = { creatorId: email, source: "creator" }; 
        sortQuery = { totalClicks: -1 }; 
    } else if (tab === "liveoffer") {
        if (creatorProfile.autodeal_active === false) {
            matchQuery = { _id: null }; 
        } else {
            matchQuery = { source: "telegram" }; 
            
            if (creatorProfile.autoDealCategories && creatorProfile.autoDealCategories.length > 0) {
                matchQuery.category = { $in: creatorProfile.autoDealCategories };
            }
        }
    }

    const categoryFilter = searchParams.get("category");
    if (categoryFilter && categoryFilter !== "null") {
        matchQuery.category = categoryFilter;
    }

    const deals = await GlobalDeal.aggregate([
      { $match: matchQuery },
      { $lookup: { from: "linkperformances", localField: "originalUrl", foreignField: "originalUrl", as: "performanceData" } },
      { $addFields: { totalClicks: { $sum: "$performanceData.clicks" } } },
      { $sort: sortQuery },
      { $skip: skip },
      { $limit: limit },
      // 🔒 DEEP SECURITY PROJECT: Sensitive database values response se vanish kar di gayi hain
      { $project: { performanceData: 0, creatorId: 0, rawAffiliateLink: 0, originalUrl: 0, expandedUrl: 0 } }
    ]);

    return NextResponse.json({ success: true, deals, page, hasMore: deals.length === limit }, { status: 200 });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}