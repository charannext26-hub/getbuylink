import { NextResponse } from "next/server";
import mongoose from "mongoose";
import GlobalDeal from "@/lib/models/GlobalDeal";
import User from "@/lib/models/User"; // 🚀 NAYA: Creator ka data check karne ke liye User model import kiya

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email"); 
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20; 
    const skip = (page - 1) * limit;
    const tab = searchParams.get("tab") || "home"; 

    if (!email) return NextResponse.json({ success: false }, { status: 400 });
    if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI);

    // 🚀 NAYA: Creator ka DB profile fetch karna
    const creatorProfile = await User.findOne({ email: email });

    // Tab ke hisaab se Query Engine
    let matchQuery = { $or: [{ creatorId: email, source: "creator" }, { source: "telegram" }] };
    let sortQuery = { createdAt: -1 };

    if (tab === "home" || tab === "categories") {
        matchQuery = { creatorId: email, source: "creator" }; // Sirf Creator ki deals
    } else if (tab === "trending") {
        matchQuery = { creatorId: email, source: "creator" }; // Trending bhi sirf Creator ka
        sortQuery = { totalClicks: -1 }; 
    } else if (tab === "liveoffer") {
        // 🚀 BUG FIXED: Database keys 'autodeal_active' aur 'autoDealCategories' ko strictly map kiya
        if (!creatorProfile || creatorProfile.autodeal_active === false) {
            matchQuery = { _id: null }; // Toggle OFF hai, toh 0 result bhejo
        } else {
            matchQuery = { source: "telegram" }; // Toggle ON hai, toh telegram deals laao
            
            // Agar specific categories select ki hain
            if (creatorProfile.autoDealCategories && creatorProfile.autoDealCategories.length > 0) {
                matchQuery.category = { $in: creatorProfile.autoDealCategories };
            }
        }
    }

    // Drawer ke Similar Products ke liye Category Filter
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
      { $project: { performanceData: 0 } }
    ]);

    return NextResponse.json({ success: true, deals, page, hasMore: deals.length === limit }, { status: 200 });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}