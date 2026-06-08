import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb"; // 🚨 NAYA: Optimized DB Connection
import LinkPerformance from "@/lib/models/LinkPerformance";

export async function GET(req) {
  try {
    // 🚨 NAYA: Prevent Vercel DB Timeout Error
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    
    // Sankmo dwara bheje gaye parameters
    const click_id = searchParams.get('click_id');
    const rawStatus = searchParams.get('status') || 'pending';
    const saleAmount = parseFloat(searchParams.get('sale_amount')) || 0;
    const creatorShare = parseFloat(searchParams.get('commission')) || 0;
    const baseOrderId = searchParams.get('order_id') || `ORDER_${Date.now()}`;
    const transaction_date = searchParams.get('transaction_date') || new Date().toISOString();
    
    // Sankmo se 'comment' (Product Name) nikalna
    const rawComment = searchParams.get('comment');

    if (!click_id) {
        return NextResponse.json({ error: "Missing click_id" }, { status: 400 });
    }

    // 1. ClickLog se pta karo ye click kiska tha
    const clickLog = await mongoose.connection.db.collection('clicklogs').findOne({ clickId: click_id });
    
    if (!clickLog) {
        console.log(`❌ SANKMO: Click ID ${click_id} not found in DB.`);
        return NextResponse.json({ success: true, message: "Click not found, ignored." }); 
    }

    const { shortCode } = clickLog;

    // 2. Original Link Doc nikalo
    const linkDoc = await LinkPerformance.findOne({ shortCode: shortCode });
    if (!linkDoc) {
        return NextResponse.json({ success: true, message: "Link data not found." });
    }

    // 3. 🧠 SMART PRODUCT NAME EXTRACTOR
    let actualProductName = linkDoc.title || "Unknown Product"; 
    if (rawComment && rawComment.trim() !== "") {
        try {
            const parsedComment = JSON.parse(rawComment);
            if (parsedComment.title) {
                actualProductName = parsedComment.title;
            } else {
                actualProductName = rawComment; 
            }
        } catch (e) {
            actualProductName = rawComment;
        }
    }

    console.log(`🔔 SANKMO POSTBACK: Order: ${baseOrderId} | Product: ${actualProductName} | Status: ${rawStatus} | Comm: ₹${creatorShare}`);

    // Status Normalization 
    let txnStatus = "pending";
    const sLower = rawStatus.toLowerCase();
    if (sLower.includes('approve') || sLower.includes('confirm') || sLower.includes('success')) {
        txnStatus = "confirmed";
    } else if (sLower.includes('reject') || sLower.includes('cancel') || sLower.includes('fail') || sLower.includes('decline')) {
        txnStatus = "cancelled";
    }

    // ============================================================
    // 🕵️‍♂️ DUPLICATE ORDER PREVENTION (Strict Matching)
    // ============================================================
    const existingTxnIndex = linkDoc.transactions.findIndex(t => 
        t.orderId === baseOrderId && t.productName === actualProductName
    );

    if (existingTxnIndex >= 0) {
        // 🔄 SCENARIO 1: ITEM EXISTS -> UPDATE STATUS & COMMISSION ONLY
        const existingTxn = linkDoc.transactions[existingTxnIndex];

        // 🚨 NAYA: DB Struct Sync Failsafe (Agar purane records mein transactionId nahi hai)
        if (!linkDoc.transactions[existingTxnIndex].transactionId) {
            linkDoc.transactions[existingTxnIndex].transactionId = `${baseOrderId}_${Math.random().toString(36).substr(2, 5)}`;
        }

        if (existingTxn.status === 'pending') linkDoc.earnings.pending -= existingTxn.commission;
        if (existingTxn.status === 'confirmed' || existingTxn.status === 'approved') linkDoc.earnings.confirmed -= existingTxn.commission;
        if (existingTxn.status === 'cancelled' || existingTxn.status === 'declined' || existingTxn.status === 'rejected') linkDoc.earnings.cancelled -= existingTxn.commission;

        linkDoc.transactions[existingTxnIndex].status = txnStatus;
        linkDoc.transactions[existingTxnIndex].commission = creatorShare;
        linkDoc.transactions[existingTxnIndex].saleAmount = saleAmount;

        if (txnStatus === 'pending') linkDoc.earnings.pending += creatorShare;
        if (txnStatus === 'confirmed' || txnStatus === 'approved') linkDoc.earnings.confirmed += creatorShare;
        if (txnStatus === 'cancelled' || txnStatus === 'declined' || txnStatus === 'rejected') linkDoc.earnings.cancelled += creatorShare;

        console.log(`🔄 SANKMO UPDATED: Order: ${baseOrderId} to status: ${txnStatus}`);
        
        await mongoose.connection.db.collection('clicklogs').updateOne(
            { clickId: click_id },
            { $set: { status: txnStatus } }
        );

    } else {
        // 🆕 SCENARIO 2: BRAND NEW ITEM -> PUSH NEW TRANSACTION
        const uniqueTxnId = `${baseOrderId}_${Math.random().toString(36).substr(2, 5)}`; 
        
        const newTransaction = {
          transactionId: uniqueTxnId, 
          orderId: baseOrderId, 
          productName: actualProductName, 
          category: linkDoc.store || "Other", 
          transactionDate: new Date(transaction_date),
          channelId: "Sankmo",
          saleAmount: saleAmount,
          commission: creatorShare,
          status: txnStatus
        };

        linkDoc.transactions.push(newTransaction);

        linkDoc.sales += 1;
        linkDoc.totalOrderValue += saleAmount;
        
        if (!linkDoc.earnings) linkDoc.earnings = { pending: 0, confirmed: 0, cancelled: 0 };
        
        if (txnStatus === 'pending') linkDoc.earnings.pending += creatorShare;
        if (txnStatus === 'confirmed' || txnStatus === 'approved') linkDoc.earnings.confirmed += creatorShare;
        if (txnStatus === 'cancelled' || txnStatus === 'declined' || txnStatus === 'rejected') linkDoc.earnings.cancelled += creatorShare;

        console.log(`✅ SANKMO ADDED NEW Sale: ${baseOrderId} - ${actualProductName}`);
        
        await mongoose.connection.db.collection('clicklogs').updateOne(
            { clickId: click_id },
            { $set: { status: txnStatus, orderId: baseOrderId } }
        );
    }

    // Safe update conversion rate
    if (linkDoc.clicks > 0) {
        linkDoc.conversionRate = parseFloat(((linkDoc.sales / linkDoc.clicks) * 100).toFixed(2));
    }

    await linkDoc.save();

    return NextResponse.json({ success: true, message: "Sankmo Postback Processed Successfully" });

  } catch (error) {
    console.error("Sankmo Postback Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
  }
}