import { NextResponse } from "next/server";
import mongoose from "mongoose";
import StoreRate from "@/lib/models/StoreRate";

export async function POST(req) {
  try {
    const apiKey = process.env.CUELINKS_API_KEY; 
    if (!apiKey) return NextResponse.json({ success: false, message: "API Key missing" });

    // Frontend humein batayega ki konsa page lana hai aur kya purana data clear karna hai
    const { page, clearFirst } = await req.json();

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Agar pehla page hai, toh purana kachra saaf kar do
    if (clearFirst) {
      await StoreRate.deleteMany({});
    }

    // SIRF EK PAGE FETCH KARO (0.5 second mein ho jayega, No Timeout!)
    const response = await fetch(`https://www.cuelinks.com/api/v2/campaigns.json?per_page=100&page=${page}`, {
      headers: { "Authorization": `Token token="${apiKey}"` }
    });

    if (!response.ok) return NextResponse.json({ success: false, message: "Cuelinks Fetch Failed" });
    
    const data = await response.json();
    const campaigns = data.campaigns || [];

    // Filter ONLY Indian & CPS (Sale) Campaigns
    const indianCPS = campaigns.filter(c => {
      const isIndia = c.countries && c.countries.some(country => country.iso === 'IN' || (country.name && country.name.toLowerCase().includes('india')));
      const isCPS = c.payout_type && c.payout_type.toLowerCase().includes('sale');
      return isIndia && isCPS; 
    });

    if (indianCPS.length > 0) {
      const dbReadyData = indianCPS.map(c => {
        let flowText = "";
        if (c.conversion_flow) {
          flowText = typeof c.conversion_flow === 'object' 
            ? Object.entries(c.conversion_flow).map(([key, value]) => `<b>${key}:</b> ${value}`).join("<br/>")
            : String(c.conversion_flow);
        }

        let infoText = "";
        const rawInfo = c.important_info_html || c.additional_info_html || "";
        infoText = (typeof rawInfo === 'object' && rawInfo !== null) ? JSON.stringify(rawInfo) : String(rawInfo);

        return {
          campaignId: c.id?.toString(),
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
        };
      });

      // Is chunk ko DB mein add kar do
      await StoreRate.insertMany(dbReadyData);
    }

    return NextResponse.json({ 
        success: true, 
        message: `Page ${page} synced! Added ${indianCPS.length} items.`,
        hasMoreData: campaigns.length > 0 // Agar page khali hai toh loop rokne ke liye
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}