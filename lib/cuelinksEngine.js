// Base URL for Cuelinks V2 API
const BASE_URL = 'https://www.cuelinks.com/api/v2';

/**
 * 1. SECURE AFFILIATE LINK GENERATOR (Official LinksRedirect Pattern)
 */
export function generateAffiliateLink(productUrl, creatorSubId) {
  try {
    const channelId = process.env.CUELINKS_CHANNEL_ID || "246005"; 
    
    // Yahi hai Cuelinks ka Asli Khufiya Tracking Server!
    const CUELINKS_TRACKING_DOMAIN = "https://linksredirect.com/";

    // Product URL ko safely encode karna
    const encodedProductUrl = encodeURIComponent(productUrl);

    // Final Link banana (cid = Channel ID, subid = Creator ID, url = Product URL)
    const finalAffiliateLink = `${CUELINKS_TRACKING_DOMAIN}?cid=${channelId}&source=getbuylink&subid=${creatorSubId}&url=${encodedProductUrl}`;

    console.log("🔥 Official Working Affiliate Link Generated!");
    return finalAffiliateLink;
    
  } catch (error) {
    console.error("Cuelinks Link Generation Failed:", error.message);
    return productUrl; 
  }
}

/**
 * 2. SECURE API CALLER (For Reports & Transactions)
 */
export async function fetchCuelinksData(endpoint, queryParams = "") {
  try {
    const apiKey = process.env.CUELINKS_API_KEY;
    const url = `${BASE_URL}/${endpoint}?${queryParams}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token token="${apiKey}"` 
      },
      cache: 'no-store' 
    });

    // Seedha JSON parse mat karo, pehle as a text padho
    const rawText = await response.text();
    
    console.log(`Cuelinks Raw Response for ${endpoint}:`, rawText.substring(0, 150) + "..."); 

    if (!response.ok) {
      console.error(`Cuelinks API Error: Status ${response.status}`);
      return null;
    }

    if (!rawText || rawText.trim() === "") {
      console.log("Cuelinks ne koi data nahi bheja (Blank Response).");
      return null;
    }

    const data = JSON.parse(rawText);
    return data;
    
  } catch (error) {
    console.error("Cuelinks Report Fetching Failed:", error.message);
    return null;
  }
}