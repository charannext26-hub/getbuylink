import { NextResponse } from "next/server";
import mongoose from "mongoose";
import GlobalDeal from "@/lib/models/GlobalDeal";
import LinkPerformance from "@/lib/models/LinkPerformance"; // 🚨 Isko import karna zaroori hai

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email"); 

    if (!email) {
      return NextResponse.json({ success: false, message: "Email missing" }, { status: 400 });
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // 🚀 THE MASTER ENGINE: Aggregation Pipeline
    const deals = await GlobalDeal.aggregate([
      // Step 1: Filter karna (Purana logic: Creator ki deals + Telegram deals)
      {
        $match: {
          $or: [
            { creatorId: email, source: "creator" }, 
            { source: "telegram" }                  
          ]
        }
      },
      
      // Step 2: LinkPerformance DB se judna (Join via originalUrl)
      {
        $lookup: {
          from: "linkperformances", // 🚨 MongoDB mein table ka naam hamesha lowercase aur plural hota hai
          localField: "originalUrl",
          foreignField: "originalUrl",
          as: "performanceData"
        }
      },
      
      // Step 3: Saare clicks ko ginna (sum) aur ek naya field "totalClicks" banana
      {
        $addFields: {
          totalClicks: { $sum: "$performanceData.clicks" }
        }
      },
      
      // Step 4: Kachra saaf karna (performance array ko hata dena taaki API data size kam rahe aur fast load ho)
      {
        $project: {
          performanceData: 0
        }
      },
      
      // Step 5: Nayi deals sabse upar (Sorting)
      {
        $sort: { createdAt: -1 }
      }
    ]);

    return NextResponse.json({ success: true, deals }, { status: 200 });

  } catch (error) {
    console.error("Fetch Deals API Error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}