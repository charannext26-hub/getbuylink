import { NextResponse } from "next/server";
import { generateAffiliateLink, fetchCuelinksData } from "@/lib/cuelinksEngine";

export async function GET(req) {
  try {
    console.log("Cuelinks API Deep Test Shuru Ho Raha Hai...");

    // TEST 1: OFFLINE LINK GENERATOR (Yeh ekdum perfect aur fast hai)
    const sampleProductUrl = "https://amzn.to/4depIx0";
    const sampleCreatorSubId = "nimai_creator";
    const generatedAffiliateLink = generateAffiliateLink(sampleProductUrl, sampleCreatorSubId);

    // TEST 2: THE CAMPAIGN API HIT (Asli Connection Test)
    // Hum Cuelinks se pooch rahe hain: "Bhai apne active brands (Campaigns) ki list do"
    console.log("Cuelinks server se Campaigns (Brands) maang rahe hain...");
    
    // Yahan humne 'transactions.json' ki jagah 'campaigns.json' laga diya hai
    const campaignData = await fetchCuelinksData('campaigns.json', 'page=1');

    return NextResponse.json({
      status: "DIAGNOSTIC_COMPLETE",
      test1_Link_Offline: generatedAffiliateLink,
      test2_Campaigns_API: campaignData ? "SUCCESS: Cuelinks API is ALIVE!" : "FAILED: Connection Issue",
      total_brands_received: campaignData ? campaignData.length : 0,
      rawData: campaignData // Yahan brands ki list aayegi
    });

  } catch (error) {
    console.error("Diagnostic Error:", error);
    return NextResponse.json({ status: "FAILED", error: error.message }, { status: 500 });
  }
}