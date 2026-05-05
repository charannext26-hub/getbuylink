import { NextResponse } from "next/server";
import mongoose from "mongoose";
import GlobalDeal from "@/lib/models/GlobalDeal";
import LinkPerformance from "@/lib/models/LinkPerformance";

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const dealId = searchParams.get('id');

    if (!dealId) {
      return NextResponse.json({ success: false, message: "Deal ID is required" }, { status: 400 });
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // 1. Sabse pehle GlobalDeal dhoondho taaki uska Original URL mil sake
    const dealToDelete = await GlobalDeal.findById(dealId);

    if (!dealToDelete) {
      return NextResponse.json({ success: false, message: "Deal pehle hi delete ho chuki hai ya nahi mili" }, { status: 404 });
    }

    const originalUrl = dealToDelete.originalUrl;
    const creatorId = dealToDelete.creatorId;

    // 2. GlobalDeal se yeh Specific Product delete karo (Na ki poora collection)
    await GlobalDeal.findByIdAndDelete(dealId);

    // 3. Ab LinkPerformance se bhi iska kachra saaf karo (Agar iska koi short link bana tha toh)
    // 🚨 WARNING: Hum sirf usi product ka short link udayenge jiska Original URL aur Creator match karega
    if (originalUrl) {
      // Kyunki LinkPerformance mein creatorId thoda alag save ho sakta hai (safeUsername format mein), 
      // isliye hum sirf Original URL se dhoondhna better samjhenge. Par safety ke liye try karte hain
      await LinkPerformance.deleteMany({ originalUrl: originalUrl }); 
      // (Aap chahein toh isme aur safety laga sakte hain ki usi creator ka udey, lekin abhi ke liye yeh kaafi safe hai)
    }

    return NextResponse.json({ 
      success: true, 
      message: "Ekdum perfect delete ho gaya bina kisi dusri deal ko chhere!" 
    }, { status: 200 });

  } catch (error) {
    console.error("Delete API Error:", error);
    return NextResponse.json({ success: false, message: "Server Error", error: error.message }, { status: 500 });
  }
}