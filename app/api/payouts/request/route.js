import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import PayoutRequest from "@/lib/models/PayoutRequest";
import LinkPerformance from "@/lib/models/LinkPerformance";

export async function POST(req) {
  console.log("🚨 PAYOUT API HIT HUI HAI! REQUEST AAYI HAI!");
  
  try {
    // 1. Session Check
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Login required!" }, { status: 401 });
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const body = await req.json();
    const { amount, paymentMethod, paymentDetails, username } = body;

    const requestAmount = parseFloat(amount);

    if (!requestAmount || requestAmount < 250) {
      return NextResponse.json({ success: false, message: "Minimum withdrawal amount is ₹250." }, { status: 400 });
    }

    if (!paymentDetails || paymentDetails.trim() === "") {
      return NextResponse.json({ success: false, message: "Please provide valid payment details." }, { status: 400 });
    }

    // 🚨 BUG FIX 1: Frontend sends "BANK", Database expects "BANK_TRANSFER"
    const finalPaymentMethod = paymentMethod === "BANK" ? "BANK_TRANSFER" : "UPI";

    // 🚨 BUG FIX 2: Username ko clean karke Case-Insensitive Match lagaya
    const safeUsername = username ? username.replace(/[^a-zA-Z0-9]/g, '') : "";
    if (!safeUsername) {
        return NextResponse.json({ success: false, message: "Username tracking error." }, { status: 400 });
    }

    const userQuery = { creatorId: { $regex: new RegExp("^" + safeUsername, "i") } };

    // 2. Calculate Real Available Balance
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

    // Check past requests
    const pastRequests = await PayoutRequest.find({ 
        creatorId: { $regex: new RegExp("^" + safeUsername, "i") },
        status: { $in: ['pending', 'paid'] } 
    }).lean();
    
    let totalRequestedOrPaid = 0;
    pastRequests.forEach(req => {
        totalRequestedOrPaid += req.amount;
    });

    const availableBalance = totalConfirmed - totalRequestedOrPaid;

    // 3. Final Verification (Added +1 buffer for floating point decimals)
    if (requestAmount > (availableBalance + 1)) {
      return NextResponse.json({ 
          success: false, 
          message: `Insufficient balance! You can only withdraw up to ₹${availableBalance.toFixed(2)}` 
      }, { status: 400 });
    }

    // 4. Save Request to Database
    const newRequest = await PayoutRequest.create({
      creatorId: safeUsername, 
      amount: requestAmount,
      paymentMethod: finalPaymentMethod, 
      paymentDetails: paymentDetails,
      status: "pending"
    });

    return NextResponse.json({ 
        success: true, 
        message: "Payout request submitted successfully! We will process it soon.",
        request: newRequest
    }, { status: 201 });

  } catch (error) {
    console.error("Payout Request API Error:", error);
    // Error message ko frontend par bhejne ke liye error.message add kar diya hai taaki future me debug aasan ho
    return NextResponse.json({ success: false, message: error.message || "Server error occurred." }, { status: 500 });
  }
}