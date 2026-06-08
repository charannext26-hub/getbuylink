import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import LinkPerformance from "@/lib/models/LinkPerformance";

export async function GET(req) {
  try {
    // 1. Bulletproof Cached Database Connection
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    
    // Exact mapping matching the CRON job data structure
    const click_id = searchParams.get('click_id'); 
    const rawStatus = searchParams.get('status') || 'pending'; 
    const saleAmount = parseFloat(searchParams.get('sale_amount')) || 0; 
    const creatorShare = parseFloat(searchParams.get('commission')) || 0; 
    
    // The Master Fix: Separate Unique Txn ID and Order ID
    const baseOrderId = searchParams.get('order_id') || "Unknown"; 
    const uniqueTxnId = searchParams.get('transaction_id') || `${baseOrderId}_${Math.random().toString(36).substr(2, 5)}`;
    
    const transaction_date = searchParams.get('transaction_date') || new Date().toISOString(); 
    const extraInfo = searchParams.get('extra_info'); 

    if (!click_id) {
        return NextResponse.json({ error: "Missing click_id" }, { status: 400 });
    }

    // 2. Fetch Click Log
    const clickLog = await mongoose.connection.db.collection('clicklogs').findOne({ clickId: click_id });
    
    if (!clickLog) {
        console.log(`❌ CUELINKS: Click ID ${click_id} not found in DB.`);
        return NextResponse.json({ success: true, message: "Click ID not recognized." }); 
    }

    const { shortCode } = clickLog;

    const linkDoc = await LinkPerformance.findOne({ shortCode: shortCode });
    if (!linkDoc) {
        return NextResponse.json({ success: true, message: "Link tracking doc not found." });
    }

    // 3. 🧠 CRON-MATCHED SMART PRODUCT NAME EXTRACTOR
    let actualProductName = linkDoc.title || "Target Product"; 
    
    if (extraInfo && extraInfo.trim() !== "" && extraInfo !== "N/A" && extraInfo !== "null") {
        actualProductName = extraInfo.replace(/[{}()\[\]]/g, "").trim();
    }

    console.log(`🔔 CUELINKS POSTBACK: Txn: ${uniqueTxnId} | Product: ${actualProductName} | Status: ${rawStatus} | Comm: ₹${creatorShare}`);

    // Status Normalization
    let txnStatus = "pending";
    const sLower = rawStatus.toLowerCase();
    if (sLower.includes('validate') || sLower.includes('approve') || sLower.includes('confirm') || sLower.includes('paid') || sLower.includes('payable')) {
        txnStatus = "confirmed";
    } else if (sLower.includes('reject') || sLower.includes('cancel') || sLower.includes('fail') || sLower.includes('decline')) {
        txnStatus = "cancelled";
    }

    // ============================================================
    // 🕵️‍♂️ CRON-MATCHED MULTI-ITEM DUPLICATE PREVENTION
    // ============================================================
    const existingTxnIndex = linkDoc.transactions.findIndex(t => {
        if (t.transactionId === uniqueTxnId && t.productName === actualProductName) return true;
        if (!t.transactionId && t.orderId === baseOrderId && t.productName === actualProductName) return true;
        return false;
    });

    if (existingTxnIndex >= 0) {
        // 🔄 SCENARIO 1: UPDATE EXISTING
        const existingTxn = linkDoc.transactions[existingTxnIndex];

        if (!linkDoc.transactions[existingTxnIndex].transactionId) {
            linkDoc.transactions[existingTxnIndex].transactionId = uniqueTxnId;
        }

        if (existingTxn.status === 'pending') linkDoc.earnings.pending -= existingTxn.commission;
        if (existingTxn.status === 'confirmed' || existingTxn.status === 'approved') linkDoc.earnings.confirmed -= existingTxn.commission;
        if (existingTxn.status === 'cancelled' || existingTxn.status === 'rejected') linkDoc.earnings.cancelled -= existingTxn.commission;

        linkDoc.transactions[existingTxnIndex].status = txnStatus;
        linkDoc.transactions[existingTxnIndex].commission = creatorShare;
        linkDoc.transactions[existingTxnIndex].saleAmount = saleAmount;

        if (txnStatus === 'pending') linkDoc.earnings.pending += creatorShare;
        if (txnStatus === 'confirmed') linkDoc.earnings.confirmed += creatorShare;
        if (txnStatus === 'cancelled') linkDoc.earnings.cancelled += creatorShare;

        console.log(`🔄 CUELINKS UPDATED: Txn ${uniqueTxnId} to: ${txnStatus}`);
        
        await mongoose.connection.db.collection('clicklogs').updateOne(
            { clickId: click_id },
            { $set: { status: txnStatus } }
        );

    } else {
        // 🆕 SCENARIO 2: ADD NEW
        const newTransaction = {
          transactionId: uniqueTxnId, 
          orderId: baseOrderId, 
          productName: actualProductName, 
          category: linkDoc.store || "Cuelinks Campaign", 
          transactionDate: new Date(transaction_date),
          channelId: "Cuelinks",
          saleAmount: saleAmount,
          commission: creatorShare,
          status: txnStatus
        };

        linkDoc.transactions.push(newTransaction);
        linkDoc.sales += 1;
        linkDoc.totalOrderValue += saleAmount;
        
        if (!linkDoc.earnings) linkDoc.earnings = { pending: 0, confirmed: 0, cancelled: 0 };
        
        if (txnStatus === 'pending') linkDoc.earnings.pending += creatorShare;
        if (txnStatus === 'confirmed') linkDoc.earnings.confirmed += creatorShare;
        if (txnStatus === 'cancelled') linkDoc.earnings.cancelled += creatorShare;

        console.log(`✅ CUELINKS ADDED NEW: ${uniqueTxnId} - ${actualProductName}`);
        
        await mongoose.connection.db.collection('clicklogs').updateOne(
            { clickId: click_id },
            { $set: { status: txnStatus, orderId: baseOrderId } }
        );
    }

    if (linkDoc.clicks > 0) {
        linkDoc.conversionRate = parseFloat(((linkDoc.sales / linkDoc.clicks) * 100).toFixed(2));
    }

    await linkDoc.save();
    return NextResponse.json({ success: true, message: "Cuelinks Postback Processed Successfully" });

  } catch (error) {
    console.error("Cuelinks Postback Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
  }
}