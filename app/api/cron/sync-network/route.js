import { NextResponse } from "next/server";
import mongoose from "mongoose";
import LinkPerformance from "@/lib/models/LinkPerformance";

export async function GET(req) {
  try {
    // 🛡️ CRON SECRET SECURITY
    const authHeader = req.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // 📅 Pichle 30 din ka data
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

    // 🚀 PROCESSING EACH TRANSACTION
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
      
      // 🚨 EXACT UNIQUE ID
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

      // 🛑 FIND THE LINK FIRST
      const linkDoc = await LinkPerformance.findOne(query);

      if (!linkDoc) {
        console.log(`⚠️ Match NOT found in DB for Sale: ${username} - ${storeName} (${shortCode})`);
        continue; 
      }

      // ============================================================
      // 🕵️‍♂️ DUPLICATE ORDER PREVENTION (THE MASTER FIX)
      // ============================================================
      const existingTxnIndex = linkDoc.transactions.findIndex(t => {
          // Priority 1: Exact Unique Transaction ID match (Sabse best)
          if (t.transactionId && t.transactionId === uniqueTxnId) return true;
          
          // Priority 2: Purane DB records ka backup (Jisme abhi transactionId nahi hai, par orderId match ho raha hai)
          if (!t.transactionId && t.orderId === orderId) return true;
          
          return false;
      });

      if (existingTxnIndex >= 0) {
        // 🔄 SCENARIO 1: ITEM EXISTS -> UPDATE STATUS & COMMISSION ONLY
        const existingTxn = linkDoc.transactions[existingTxnIndex];

        // 🚨 UPGRADE OLD RECORDS: Agar purane record mein transactionId nahi hai, toh abhi daal do!
        if (!linkDoc.transactions[existingTxnIndex].transactionId) {
            linkDoc.transactions[existingTxnIndex].transactionId = uniqueTxnId;
        }

        // Deduct old values from Aggregates before adding new ones
        if (existingTxn.status === 'pending') linkDoc.earnings.pending -= existingTxn.commission;
        if (existingTxn.status === 'approved' || existingTxn.status === 'confirmed') linkDoc.earnings.confirmed -= existingTxn.commission;
        if (existingTxn.status === 'cancelled' || existingTxn.status === 'declined' || existingTxn.status === 'rejected') linkDoc.earnings.cancelled -= existingTxn.commission;

        // Update the specific transaction object
        linkDoc.transactions[existingTxnIndex].status = txnStatus;
        linkDoc.transactions[existingTxnIndex].commission = creatorShare;

        // Add new values to Aggregates
        if (txnStatus === 'pending') linkDoc.earnings.pending += creatorShare;
        if (txnStatus === 'approved' || txnStatus === 'confirmed') linkDoc.earnings.confirmed += creatorShare;
        if (txnStatus === 'cancelled' || txnStatus === 'declined' || txnStatus === 'rejected') linkDoc.earnings.cancelled += creatorShare;

        console.log(`🔄 UPDATED Item ID: ${uniqueTxnId} (Order: ${orderId}) to status: ${txnStatus}`);

      } else {
        // 🆕 SCENARIO 2: BRAND NEW ITEM -> PUSH NEW TRANSACTION
        
        const newTransaction = {
          transactionId: uniqueTxnId, 
          orderId: orderId, 
          productName: txn.product_name || txn.extra_info || "Unknown Product",
          category: txn.category || "Other",
          transactionDate: txn.transaction_date ? new Date(txn.transaction_date) : new Date(),
          channelId: txn.channel_id || "",
          saleAmount: saleAmount,
          commission: creatorShare,
          status: txnStatus
        };

        // Add to array
        linkDoc.transactions.push(newTransaction);

        // Increment Aggregates (ONLY FOR NEW ITEMS)
        linkDoc.sales += 1;
        linkDoc.totalOrderValue += saleAmount;
        
        // Add to earnings based on status
        if (txnStatus === 'pending') linkDoc.earnings.pending += creatorShare;
        if (txnStatus === 'approved' || txnStatus === 'confirmed') linkDoc.earnings.confirmed += creatorShare;
        if (txnStatus === 'cancelled' || txnStatus === 'declined' || txnStatus === 'rejected') linkDoc.earnings.cancelled += creatorShare;

        console.log(`✅ ADDED NEW Item ID: ${uniqueTxnId} for ${username} (Link: ${shortCode})`);
      }

      // Safe update conversion rate
      if (linkDoc.clicks > 0) {
        linkDoc.conversionRate = (linkDoc.sales / linkDoc.clicks) * 100;
      }

      // Finally, save the updated document
      await linkDoc.save();
      updatedCount++;
    }

    return NextResponse.json({ success: true, updatedRecords: updatedCount, message: "Sync successful" });

  } catch (error) {
    console.error("⛔ CRON Sync Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}