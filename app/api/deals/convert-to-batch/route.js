import { NextResponse } from "next/server";
import mongoose from "mongoose";
import GlobalDeal from "@/lib/models/GlobalDeal";

export async function POST(req) {
  try {
    const { dealId, batchId, collectionName } = await req.json();

    if (!dealId || !batchId) {
      return NextResponse.json({ success: false, message: "Deal ID or Batch ID missing" }, { status: 400 });
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Purani Single Deal ko dhoondho aur usme batchId update kar do
    const updatedDeal = await GlobalDeal.findByIdAndUpdate(
      dealId,
      { 
        batchId: batchId,
        collectionName: collectionName || "New Collection" 
      },
      { new: true } // Return updated document
    );

    if (!updatedDeal) {
      return NextResponse.json({ success: false, message: "Purani deal nahi mili" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Single deal converted to Batch successfully!",
      deal: updatedDeal
    }, { status: 200 });

  } catch (error) {
    console.error("Convert to Batch API Error:", error);
    return NextResponse.json({ success: false, message: "Server Error", error: error.message }, { status: 500 });
  }
}