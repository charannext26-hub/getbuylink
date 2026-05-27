import { NextResponse } from "next/server";
import mongoose from "mongoose";
import StoreRate from "@/lib/models/StoreRate";

export const dynamic = 'force-dynamic';

// 1. GET: Fetch stores with Search and Pagination
export async function GET(req) {
    try {
        if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI);

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = 150; // 150 stores per page
        const search = searchParams.get('search') || "";

        // Search Query Builder (Name, Domain, ya Campaign ID se search)
        let query = {};
        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { domain: { $regex: search, $options: 'i' } },
                    { campaignId: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const skip = (page - 1) * limit;

        // DB se fetch karna
        const stores = await StoreRate.find(query)
            .sort({ name: 1 }) // A-Z sorting
            .skip(skip)
            .limit(limit)
            .lean();

        // Total count (Next button logic ke liye)
        const totalStores = await StoreRate.countDocuments(query);
        const totalPages = Math.ceil(totalStores / limit);

        return NextResponse.json({ success: true, stores, totalPages, currentPage: page, totalStores });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// 2. PATCH: Toggle isHidden status
export async function PATCH(req) {
    try {
        const { id, isHidden } = await req.json();
        
        if (!id) return NextResponse.json({ success: false, message: "ID missing" }, { status: 400 });
        if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI);

        const updatedStore = await StoreRate.findByIdAndUpdate(id, { isHidden: isHidden }, { new: true });

        return NextResponse.json({ success: true, message: `Store ${isHidden ? 'Hidden' : 'Visible'} Successfully!` });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}