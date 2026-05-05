import { NextResponse } from "next/server";
import mongoose from "mongoose";
import LinkPerformance from "@/lib/models/LinkPerformance";
import GlobalDeal from "@/lib/models/GlobalDeal";

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const { searchParams } = new URL(req.url);
    const rawUsername = searchParams.get("username");
    const timeline = searchParams.get("timeline") || "3days"; 

    if (!rawUsername) {
      return NextResponse.json({ success: false, message: "Username missing" }, { status: 400 });
    }

    const safeUsername = rawUsername.replace(/[^a-zA-Z0-9]/g, '');

    // 1. 📅 BUILD DATE FILTER
    let dateFilter = null;
    let startDate, endDate;

    if (timeline !== "all") {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(now.getTime() + istOffset);
      startDate = new Date(istNow);

      if (timeline === "today") {
        startDate.setUTCHours(0, 0, 0, 0);
      } else if (timeline === "yesterday") {
        startDate.setUTCDate(istNow.getUTCDate() - 1);
        startDate.setUTCHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setUTCHours(23, 59, 59, 999);
      } else if (timeline === "3days") {
        startDate.setUTCDate(istNow.getUTCDate() - 3);
        startDate.setUTCHours(0, 0, 0, 0);
      } else if (timeline === "7days") {
        startDate.setUTCDate(istNow.getUTCDate() - 7);
        startDate.setUTCHours(0, 0, 0, 0);
      } else if (timeline === "30days") {
        startDate.setUTCDate(istNow.getUTCDate() - 30);
        startDate.setUTCHours(0, 0, 0, 0);
      }
      
      const realStart = new Date(startDate.getTime() - istOffset);
      const realEnd = endDate ? new Date(endDate.getTime() - istOffset) : null;
      
      dateFilter = realEnd ? { $gte: realStart, $lte: realEnd } : { $gte: realStart };
    }

    // Fetch all links once
    let query = { creatorId: { $regex: new RegExp("^" + safeUsername, "i") } };
    const allLinks = await LinkPerformance.find(query).lean();

    // Image Map generation
    const globalDealIds = [];
    const shortCodes = [];
    const originalUrls = [];

    allLinks.forEach(link => {
        if (link.globalDealId && mongoose.Types.ObjectId.isValid(link.globalDealId)) globalDealIds.push(link.globalDealId);
        if (link.shortCode) shortCodes.push(link.shortCode);
        if (link.originalUrl) originalUrls.push(link.originalUrl);
    });

    const dealsWithImages = await GlobalDeal.find({
        $or: [
            { _id: { $in: globalDealIds } },
            { shortCode: { $in: shortCodes } },
            { originalUrl: { $in: originalUrls } }
        ]
    }).select('_id shortCode originalUrl image').lean();

    const imageMap = {};
    dealsWithImages.forEach(deal => {
        if (deal.image) {
            imageMap[deal._id.toString()] = deal.image;
            if (deal.shortCode) imageMap[deal.shortCode] = deal.image;
            if (deal.originalUrl) imageMap[deal.originalUrl] = deal.image;
        }
    });

    // 2. 📊 INITIALIZE
    let overall = { 
        totalClicks: 0, totalOrders: 0, totalSaleAmount: 0, 
        totalEarnings: 0, pendingEarnings: 0, approvedEarnings: 0 
    };

    let storeStats = {};
    let categoryStats = {};
    let dailyGraph = {}; 

    const stats = {
      autoPost: { clicks: 0, orders: 0, earnings: 0, saleAmount: 0, links: [] },
      manualPost: { clicks: 0, orders: 0, earnings: 0, saleAmount: 0, links: [] }
    };

    // ==========================================
    // 3. 🧠 PROCESS THE DATA (WITH TIME-RANGE FILTERING)
    // ==========================================
    allLinks.forEach(link => {
      const source = link.source?.toLowerCase() || "";
      const isAuto = ["telegram", "auto-post-share"].includes(source);
      const target = isAuto ? stats.autoPost : stats.manualPost;

      let linkOrders = 0;
      let linkSaleAmount = 0;
      let linkEarnings = 0;
      let validTransactions = [];
      let hasActivityInRange = false; // 🚨 Link list filter variable

      // 👉 TRANSACTION FILTERING
      if (link.transactions && Array.isArray(link.transactions)) {
          link.transactions.forEach(txn => {
              if (dateFilter && txn.transactionDate) {
                  const txnDate = new Date(txn.transactionDate);
                  if (dateFilter.$gte && txnDate < dateFilter.$gte) return;
                  if (dateFilter.$lte && txnDate > dateFilter.$lte) return;
              }

              hasActivityInRange = true; // Order mila matlab activity hai

              const txnAmount = parseFloat(txn.saleAmount) || 0;
              const txnComm = parseFloat(txn.commission) || 0;
              
              if (txn.status !== "declined" && txn.status !== "cancelled" && txn.status !== "rejected") {
                  linkOrders += 1;
                  linkSaleAmount += txnAmount;
                  linkEarnings += txnComm;

                  overall.totalOrders += 1;
                  overall.totalSaleAmount += txnAmount;
                  overall.totalEarnings += txnComm;

                  if (txn.status === "pending") overall.pendingEarnings += txnComm;
                  if (txn.status === "approved" || txn.status === "confirmed") overall.approvedEarnings += txnComm;

                  const storeName = link.store || "Unknown";
                  if (!storeStats[storeName]) storeStats[storeName] = { earnings: 0, orders: 0 };
                  storeStats[storeName].earnings += txnComm;
                  storeStats[storeName].orders += 1;

                  const catName = txn.category || "General";
                  if (!categoryStats[catName]) categoryStats[catName] = { earnings: 0, orders: 0 };
                  categoryStats[catName].earnings += txnComm;
                  categoryStats[catName].orders += 1;

                  let saleDateStr = new Date().toISOString().split('T')[0];
                  try {
                      if(txn.transactionDate) saleDateStr = new Date(txn.transactionDate).toISOString().split('T')[0];
                  } catch(e) {}

                  if (!dailyGraph[saleDateStr]) dailyGraph[saleDateStr] = { clicks: 0, sales: 0, earnings: 0 };
                  dailyGraph[saleDateStr].sales += 1;
                  dailyGraph[saleDateStr].earnings += txnComm; 
                  validTransactions.push(txn);
              }
          });
      }

      // 👉 CLICK FILTERING
      let linkClicksInRange = 0;
      if (timeline === "all") {
          linkClicksInRange = link.clicks || 0;
          if (linkClicksInRange > 0) hasActivityInRange = true;
      } else {
          if (link.lastClickedAt) {
              const clickDate = new Date(link.lastClickedAt);
              if (!((dateFilter.$gte && clickDate < dateFilter.$gte) || (dateFilter.$lte && clickDate > dateFilter.$lte))) {
                 linkClicksInRange = link.clicks || 0; 
                 hasActivityInRange = true; // Click mila matlab activity hai
              }
          }
      }

      // 🚨 FIX: Agar is time-range mein na Click aaya na Order, toh hide kar do
      if (!hasActivityInRange) return;

      target.clicks += linkClicksInRange;
      overall.totalClicks += linkClicksInRange;

      if (linkClicksInRange > 0) {
        let clickDateStr = new Date().toISOString().split('T')[0];
        try {
            if (link.lastClickedAt) clickDateStr = new Date(link.lastClickedAt).toISOString().split('T')[0];
        } catch (e) {}
        if (!dailyGraph[clickDateStr]) dailyGraph[clickDateStr] = { clicks: 0, sales: 0, earnings: 0 };
        dailyGraph[clickDateStr].clicks += linkClicksInRange; 
      }

      target.orders += linkOrders;
      target.saleAmount += linkSaleAmount;
      target.earnings += linkEarnings;

      let bestImage = 'https://via.placeholder.com/150?text=Product';
      if (link.globalDealId && imageMap[link.globalDealId]) bestImage = imageMap[link.globalDealId];
      else if (link.shortCode && imageMap[link.shortCode]) bestImage = imageMap[link.shortCode];
      else if (link.originalUrl && imageMap[link.originalUrl]) bestImage = imageMap[link.originalUrl];

      target.links.push({
        id: link._id,
        shortCode: link.shortCode,
        title: link.title,
        originalUrl: link.originalUrl,
        imageUrl: bestImage, 
        clicks: linkClicksInRange,
        orders: linkOrders,
        saleAmount: linkSaleAmount,
        earnings: linkEarnings,
        store: link.store,
        conversion: linkClicksInRange > 0 ? ((linkOrders / linkClicksInRange) * 100).toFixed(1) : 0,
        aov: linkOrders > 0 ? (linkSaleAmount / linkOrders).toFixed(0) : 0,
        transactions: validTransactions
      });
    });

    // 4. CLEANUP
    overall.aov = overall.totalOrders > 0 ? (overall.totalSaleAmount / overall.totalOrders).toFixed(0) : 0;
    overall.conversion = overall.totalClicks > 0 ? ((overall.totalOrders / overall.totalClicks) * 100).toFixed(2) : 0;

    const sortLinks = (a, b) => b.earnings - a.earnings || b.clicks - a.clicks; 
    stats.autoPost.links.sort(sortLinks);
    stats.manualPost.links.sort(sortLinks);

    const formattedStoreStats = Object.keys(storeStats).map(key => ({ name: key, value: storeStats[key].earnings })).filter(s => s.value > 0);
    const formattedCategoryStats = Object.keys(categoryStats).map(key => ({ name: key, value: categoryStats[key].earnings })).filter(s => s.value > 0);
    
    const graphData = Object.keys(dailyGraph).sort().map(date => ({
        date: date,
        clicks: dailyGraph[date].clicks,
        sales: dailyGraph[date].sales,
        earnings: parseFloat(dailyGraph[date].earnings.toFixed(2)) 
    }));

    return NextResponse.json({
      success: true,
      data: {
        overall,
        graphs: {
            daily: graphData,
            stores: formattedStoreStats,
            categories: formattedCategoryStats
        },
        autoPostStats: {
          clicks: stats.autoPost.clicks,
          orders: stats.autoPost.orders,
          earnings: stats.autoPost.earnings,
          saleAmount: stats.autoPost.saleAmount,
          conversion: stats.autoPost.clicks > 0 ? ((stats.autoPost.orders / stats.autoPost.clicks) * 100).toFixed(2) : 0,
          epc: stats.autoPost.clicks > 0 ? (stats.autoPost.earnings / stats.autoPost.clicks).toFixed(2) : 0,
          links: stats.autoPost.links
        },
        manualPostStats: {
          clicks: stats.manualPost.clicks,
          orders: stats.manualPost.orders,
          earnings: stats.manualPost.earnings,
          saleAmount: stats.manualPost.saleAmount,
          conversion: stats.manualPost.clicks > 0 ? ((stats.manualPost.orders / stats.manualPost.clicks) * 100).toFixed(2) : 0,
          epc: stats.manualPost.clicks > 0 ? (stats.manualPost.earnings / stats.manualPost.clicks).toFixed(2) : 0,
          links: stats.manualPost.links
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Analytics API Error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}