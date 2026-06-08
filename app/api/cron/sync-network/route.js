import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import LinkPerformance from "@/lib/models/LinkPerformance";

export async function GET(req) {
  try {
    // 🛡️ CRON SECRET SECURITY
    const authHeader = req.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Cached connection module used to prevent connection pool exhausting
    await connectToDatabase();

    // 📅 Past 30 days data synchronization bounds
    const endDate = new Date().toISOString().split('T')[0]; 
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; 
    const CUELINKS_API_KEY = process.env.CUELINKS_API_KEY;
    
    const apiUrl = `https://www.cuelinks.com/api/v2/transactions.json?start_date=${startDate}&end_date=${endDate}&page=1`;

    console.log(`🔄 Fetching Real Data from Cuelinks... Date: ${startDate} to ${endDate}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 
        'Authorization': `Token token="${CUELINKS_API_KEY}"`
      }
    });

    console.log("📡 Cuelinks Status Code:", response.status);

    if (response.status === 204) {
      console.log("🤷‍♂️ No Content from Cuelinks.");
      return NextResponse.json({ success: true, updatedRecords: 0, message: "No new sales." });
    }

    const rawText = await response.text();
    if (!response.ok) throw new Error(`Cuelinks API Error: ${response.status}`);
    if (!rawText) throw new Error("Empty response from Cuelinks.");

    const data = JSON.parse(rawText);
    const transactions = data.transactions || [];
    let updatedCount = 0;

    // 🚀 PROCESSING EACH TRANSACTION FROM THE PULL STREAM
    for (const txn of transactions) {
      
      const username = txn.aff_sub || txn.subid1; 
      let shortCode = txn.subid2; 
      
      if (!shortCode || shortCode === "") {
          const possibleIds = [txn.subid1, txn.subid3, txn.subid4];
          for(let id of possibleIds) {
              if(id && id.length >= 5 && id.length <= 8 && id !== username) {
                  shortCode = id; break;
              }
          }
      }
      
      if (!username) continue; 

      const storeName = txn.store_name || "Unknown";
      
      // 🚨 EXACT UNIQUE TRANSACTION ID FROM CUELINKS
      const uniqueTxnId = txn.id ? txn.id.toString() : `${txn.order_id}_${Math.random().toString(36).substr(2,5)}`;
      const orderId = txn.order_id || "Unknown"; 
      const txnStatus = (txn.status || "pending").toLowerCase();

      // 💰 COMMISSION SETTINGS
      const totalCommission = parseFloat(txn.user_commission) || parseFloat(txn.commission) || 0;
      const saleAmount = parseFloat(txn.sale_amount) || 0;
      const creatorShare = totalCommission * 1.0; 

      // 🔍 QUERY BUILDER
      let query = { creatorId: username }; 
      if (shortCode && shortCode.length >= 5) {
          query.shortCode = shortCode;
      } else {
          query.store = new RegExp(storeName, "i");
      }

      // 🛑 FIND THE TRACKING DOCUMENT
      const linkDoc = await LinkPerformance.findOne(query);

      if (!linkDoc) {
        console.log(`⚠️ Match NOT found in DB for Sale: ${username} - ${storeName} (${shortCode})`);
        continue; 
      }

      // 🧠 MASTER FALLBACK SMART PRODUCT NAME EXTRACTOR
      let actualProductName = txn.product_name || "Target Product";

      // Checking if product name is invalid/missing and substituting extra_info string context safely
      if (!txn.product_name || txn.product_name.trim() === "" || txn.product_name === "N/A") {
        if (txn.extra_info && txn.extra_info.trim() !== "" && txn.extra_info !== "N/A" && txn.extra_info !== "null") {
          // Cleans template syntax strings or curly braces if emitted by certain affiliate edge subids
          actualProductName = txn.extra_info.replace(/[{}()\[\]]/g, "").trim();
        } else if (linkDoc.title) {
          actualProductName = linkDoc.title; // Ultimate fallback to original generated link title asset
        }
      }

      // ============================================================
      // 🕵️‍♂️ MULTI-ITEM SAME-ORDER DUPLICATE PREVENTION LOGIC
      // ============================================================
      const existingTxnIndex = linkDoc.transactions.findIndex(t => {
          // Multi-item order mapping check (transaction ID + unique extracted product string)
          if (t.transactionId === uniqueTxnId && t.productName === actualProductName) return true;
          if (!t.transactionId && t.orderId === orderId && t.productName === actualProductName) return true;
          return false;
      });

      if (existingTxnIndex >= 0) {
        // 🔄 SCENARIO 1: ITEM STRUCT FOUND -> RE-CALCULATE AGGREGATES & UPDATE Lifecycle STATUS
        const existingTxn = linkDoc.transactions[existingTxnIndex];

        // Ensure current sync object retains unique ID sequence values
        if (!linkDoc.transactions[existingTxnIndex].transactionId) {
            linkDoc.transactions[existingTxnIndex].transactionId = uniqueTxnId;
        }

        // Subtracting past values out before patching new network states back into aggregate fields
        if (existingTxn.status === 'pending') linkDoc.earnings.pending -= existingTxn.commission;
        if (existingTxn.status === 'approved' || existingTxn.status === 'confirmed') linkDoc.earnings.confirmed -= existingTxn.commission;
        if (existingTxn.status === 'cancelled' || existingTxn.status === 'declined' || existingTxn.status === 'rejected') linkDoc.earnings.cancelled -= existingTxn.commission;

        // Sync fresh status/commission payload items
        linkDoc.transactions[existingTxnIndex].status = txnStatus;
        linkDoc.transactions[existingTxnIndex].commission = creatorShare;
        linkDoc.transactions[existingTxnIndex].saleAmount = saleAmount;

        // Re-adding adjusted payload items back into global balance tracking items
        if (txnStatus === 'pending') linkDoc.earnings.pending += creatorShare;
        if (txnStatus === 'approved' || txnStatus === 'confirmed') linkDoc.earnings.confirmed += creatorShare;
        if (txnStatus === 'cancelled' || txnStatus === 'declined' || txnStatus === 'rejected') linkDoc.earnings.cancelled += creatorShare;

        console.log(`🔄 CRON SYNC UPDATE: Txn: ${uniqueTxnId} (${actualProductName}) status set to: ${txnStatus}`);

      } else {
        // 🆕 SCENARIO 2: GENUINE NEW ITEM RECORD -> PUSH NEW OBJECT STRUCT
        const newTransaction = {
          transactionId: uniqueTxnId, 
          orderId: orderId, 
          productName: actualProductName,
          category: txn.category || "Other",
          transactionDate: txn.transaction_date ? new Date(txn.transaction_date) : new Date(),
          channelId: txn.channel_id || "Cuelinks",
          saleAmount: saleAmount,
          commission: creatorShare,
          status: txnStatus
        };

        linkDoc.transactions.push(newTransaction);

        // Core balance aggregation values incremental step logic runs exclusively on new items
        linkDoc.sales += 1;
        linkDoc.totalOrderValue += saleAmount;
        
        if (!linkDoc.earnings) linkDoc.earnings = { pending: 0, confirmed: 0, cancelled: 0 };
        
        if (txnStatus === 'pending') linkDoc.earnings.pending += creatorShare;
        if (txnStatus === 'approved' || txnStatus === 'confirmed') linkDoc.earnings.confirmed += creatorShare;
        if (txnStatus === 'cancelled' || txnStatus === 'declined' || txnStatus === 'rejected') linkDoc.earnings.cancelled += creatorShare;

        console.log(`✅ CRON SYNC ADDED: Txn: ${uniqueTxnId} (${actualProductName}) for user ${username}`);
      }

      // Safe update conversion rate calculations
      if (linkDoc.clicks > 0) {
        linkDoc.conversionRate = parseFloat(((linkDoc.sales / linkDoc.clicks) * 100).toFixed(2));
      }

      await linkDoc.save();
      updatedCount++;
    }

    return NextResponse.json({ success: true, updatedRecords: updatedCount, message: "Sync execution successfully closed." });

  } catch (error) {
    console.error("⛔ CRON Sync Global Script Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}