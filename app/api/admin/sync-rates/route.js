import { NextResponse } from "next/server";
import mongoose from "mongoose";
import StoreRate from "@/lib/models/StoreRate";

export async function POST(req) {
  try {
    const apiKey = process.env.CUELINKS_API_KEY; 
    if (!apiKey) return NextResponse.json({ success: false, message: "API Key missing" });

    const { page, clearFirst } = await req.json();

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // 🚨 THE FIX: Sirf wo data delete karo jo manual NAHI hai.
    // Aapke Sankmo ke manual rates hamesha safe rahenge!
    if (clearFirst) {
      await StoreRate.deleteMany({ isManual: { $ne: true } });
    }

    const response = await fetch(`https://www.cuelinks.com/api/v2/campaigns.json?per_page=100&page=${page}`, {
      headers: { "Authorization": `Token token="${apiKey}"` }
    });

    if (!response.ok) return NextResponse.json({ success: false, message: "Cuelinks Fetch Failed" });
  

// NAYA SAFE CODE:
const rawText = await response.text();
if (!rawText || rawText.trim() === "") {
    return NextResponse.json({ success: true, message: "No more data from Cuelinks.", hasMoreData: false });
}

let data;
try {
    data = JSON.parse(rawText);
} catch (e) {
    return NextResponse.json({ success: false, message: "Cuelinks rate limit hit ya invalid data aaya." }, { status: 400 });
}
    const campaigns = data.campaigns || [];

    const indianCPS = campaigns.filter(c => {
      const isIndia = c.countries && c.countries.some(country => country.iso === 'IN' || (country.name && country.name.toLowerCase().includes('india')));
      const isCPS = c.payout_type && c.payout_type.toLowerCase().includes('sale');
      return isIndia && isCPS; 
    });

    if (indianCPS.length > 0) {
      // Pehle database se saare Manual Stores (Sankmo wale) ki list nikal lo
      const manualStores = await StoreRate.find({ isManual: true }).select('name domain');
      const manualStoreDomains = manualStores.map(s => s.domain?.toLowerCase());

      const dbReadyData = [];

      indianCPS.forEach(c => {
         // 🚨 THE BLOCKER: Agar ye store aapne manually Sankmo se set kiya hai (e.g. flipkart.com), 
         // toh Cuelinks wale is rate ko skip kar do.
         if (c.domain && manualStoreDomains.includes(c.domain.toLowerCase())) {
             return; // Skip this one
         }

        let flowText = "";
        if (c.conversion_flow) {
          flowText = typeof c.conversion_flow === 'object' 
            ? Object.entries(c.conversion_flow).map(([key, value]) => `<b>${key}:</b> ${value}`).join("<br/>")
            : String(c.conversion_flow);
        }

        let infoText = "";
        const rawInfo = c.important_info_html || c.additional_info_html || "";
        infoText = (typeof rawInfo === 'object' && rawInfo !== null) ? JSON.stringify(rawInfo) : String(rawInfo);

        dbReadyData.push({
          campaignId: `CUE_${c.id?.toString()}`, // Tagging it as Cuelinks
          name: c.name,
          domain: c.domain,
          image: c.image,
          payout: c.payout?.toString(),
          payout_type: c.payout_type,
          payout_categories: c.payout_categories || [],
          countries: c.countries || [],
          important_info_html: infoText,
          conversion_flow: flowText,
          cookie_duration: c.cookie_duration?.toString() || "Unknown",
          isManual: false
        });
      });

      if (dbReadyData.length > 0) {
        // Upsert use karenge taaki duplicate IDs na banen
        const bulkOps = dbReadyData.map(item => ({
            updateOne: {
                filter: { campaignId: item.campaignId },
                update: { $set: item },
                upsert: true
            }
        }));
        await StoreRate.bulkWrite(bulkOps);
      }
    }

    return NextResponse.json({ 
        success: true, 
        message: `Page ${page} synced! Added/Updated items.`,
        hasMoreData: campaigns.length > 0 
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}