import { NextResponse } from "next/server";
import mongoose from "mongoose";
import GlobalDeal from "@/lib/models/GlobalDeal";

export async function POST(req) {
  try {
    const { isBatch, batchId, dealId, title, videoUrl, category } = await req.json();

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // 🚨 THE FIX: Agar dealId aayi hai (Yani Single Product ko Collection banana hai)
    if (dealId) {
      const updateData = {
        title: title,
        videoUrl: videoUrl || "",
        category: category || "Other"
      };

      // Agar naya batchId aaya hai, toh Single product par chipka do!
      if (batchId) {
        updateData.batchId = batchId;
        updateData.collectionName = title || "New Collection";
      }

      await GlobalDeal.findByIdAndUpdate(dealId, { $set: updateData });
    } 
    // Agar pehle se bani hui Collection ko update karna hai
    else if (isBatch && batchId) {
      await GlobalDeal.updateMany(
        { batchId: batchId },
        { 
          $set: { 
            collectionName: title, 
            videoUrl: videoUrl || "",
            category: category || "Other" 
          } 
        }
      );
    } else {
      return NextResponse.json({ success: false, message: "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Details Updated Successfully!" }, { status: 200 });

  } catch (error) {
    console.error("Update Details API Error:", error);
    return NextResponse.json({ success: false, message: "Server Error", error: error.message }, { status: 500 });
  }
}