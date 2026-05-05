import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import PayoutRequest from "@/lib/models/PayoutRequest";
import LinkPerformance from "@/lib/models/LinkPerformance";

// =====================================================================
// 1. POST: FOR CREATORS (TO SUBMIT WITHDRAWAL REQUEST)
// =====================================================================
export async function POST(req) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Login required!" }, { status: 401 });
    }

    if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI);

    const body = await req.json();
    const { amount, paymentMethod, paymentDetails, username } = body;

    const requestAmount = parseFloat(amount);
    if (!requestAmount || requestAmount < 250) {
      return NextResponse.json({ success: false, message: "Minimum withdrawal amount is ₹250." }, { status: 400 });
    }
    if (!paymentDetails || paymentDetails.trim() === "") {
      return NextResponse.json({ success: false, message: "Please provide valid payment details." }, { status: 400 });
    }

    const finalPaymentMethod = paymentMethod === "BANK" ? "BANK_TRANSFER" : "UPI";
    
    // Clean Username
    const safeUsername = username ? username.replace(/[^a-zA-Z0-9]/g, '') : "";
    if (!safeUsername) return NextResponse.json({ success: false, message: "Username error." }, { status: 400 });

    const userQuery = { creatorId: { $regex: new RegExp("^" + safeUsername, "i") } };

    const allLinks = await LinkPerformance.find(userQuery).lean();
    let totalConfirmed = 0;
    allLinks.forEach(link => {
        if (link.transactions && link.transactions.length > 0) {
            link.transactions.forEach(txn => {
                if (txn.status === "approved" || txn.status === "confirmed") {
                    totalConfirmed += (parseFloat(txn.commission) || 0);
                }
            });
        }
    });

    const pastRequests = await PayoutRequest.find({ 
        creatorId: { $regex: new RegExp("^" + safeUsername, "i") },
        status: { $in: ['pending', 'paid'] } 
    }).lean();
    
    let totalRequestedOrPaid = 0;
    pastRequests.forEach(req => totalRequestedOrPaid += req.amount);

    const availableBalance = totalConfirmed - totalRequestedOrPaid;

    if (requestAmount > (availableBalance + 1)) {
      return NextResponse.json({ success: false, message: `Insufficient balance! You can only withdraw up to ₹${availableBalance.toFixed(2)}` }, { status: 400 });
    }

    const newRequest = await PayoutRequest.create({
      creatorId: safeUsername, 
      amount: requestAmount,
      paymentMethod: finalPaymentMethod,
      paymentDetails: paymentDetails,
      status: "pending"
    });

    return NextResponse.json({ success: true, message: "Payout request submitted!", request: newRequest }, { status: 201 });

  } catch (error) {
    console.error("Payout Request API Error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error occurred." }, { status: 500 });
  }
}

// =====================================================================
// 2. GET: FOR ADMIN & CREATOR HISTORY
// =====================================================================
export async function GET(req) {
  try {
    if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI);
    
    const { searchParams } = new URL(req.url);
    const rawUsername = searchParams.get("username");

    let query = {};
    if (rawUsername) {
        // 🚨 YAHI WO JADUI FIX HAI (Underscore hatane ke liye) 🚨
        const safeUsername = rawUsername.replace(/[^a-zA-Z0-9]/g, '');
        query.creatorId = { $regex: new RegExp("^" + safeUsername, "i") };
    }

    const requests = await PayoutRequest.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// =====================================================================
// 3. PATCH: FOR ADMIN (TO MARK AS PAID/REJECTED)
// =====================================================================
export async function PATCH(req) {
  try {
    if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI);

    const body = await req.json();
    const { requestId, status, adminRemarks } = body;

    const updateData = { status, adminRemarks };
    if (status === "paid") updateData.paidAt = new Date();

    const updated = await PayoutRequest.findByIdAndUpdate(requestId, { $set: updateData }, { new: true });
    if (!updated) return NextResponse.json({ success: false, message: "Request not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: `Request marked as ${status}!` });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}