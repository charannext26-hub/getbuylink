import { NextResponse } from "next/server";
import mongoose from "mongoose";
import GlobalDeal from "@/lib/models/GlobalDeal";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email"); 
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20; 
    const skip = (page - 1) * limit;
    const tab = searchParams.get("tab") || "home"; // 🚀 NAYA: Tab check 

    if (!email) return NextResponse.json({ success: false }, { status: 400 });
    if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI);

    // Tab ke hisaab se Query Engine
    let matchQuery = { $or: [{ creatorId: email, source: "creator" }, { source: "telegram" }] };
    let sortQuery = { createdAt: -1 };

    if (tab === "home") {
        matchQuery = { creatorId: email, source: "creator" };
    } else if (tab === "liveoffer") {
        matchQuery = { source: "telegram" };
    } else if (tab === "trending") {
        // Trending mein saare deals aayenge, par clicks ke hisaab se sort honge
        sortQuery = { totalClicks: -1 }; 
    }

    const deals = await GlobalDeal.aggregate([
      { $match: matchQuery },
      { $lookup: { from: "linkperformances", localField: "originalUrl", foreignField: "originalUrl", as: "performanceData" } },
      { $addFields: { totalClicks: { $sum: "$performanceData.clicks" } } },
      { $sort: sortQuery },
      { $skip: skip },
      { $limit: limit },
      { $project: { performanceData: 0 } }
    ]);

    return NextResponse.json({ success: true, deals, page, hasMore: deals.length === limit }, { status: 200 });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}