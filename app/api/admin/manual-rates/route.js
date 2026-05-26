import { NextResponse } from "next/server";
import mongoose from "mongoose";
import StoreRate from "@/lib/models/StoreRate";

export const dynamic = 'force-dynamic';

// 1. GET: Saare manual stores ko Table me dikhane ke liye fetch karna
export async function GET() {
    try {
        if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI);
        
        // Sirf wahi stores lao jo Manual hain (Sankmo wale)
        const stores = await StoreRate.find({ isManual: true }).lean();
        
        return NextResponse.json({ success: true, stores });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// 2. DELETE: Table se manual store delete karne ke liye
export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        
        if (!id) return NextResponse.json({ success: false, message: "ID missing" }, { status: 400 });
        
        if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI);
        
        await StoreRate.findByIdAndDelete(id);
        
        return NextResponse.json({ success: true, message: "Store Deleted!" });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// 3. POST: Naya store save karne ya purana Update (Edit) karne ke liye
export async function POST(req) {
  try {
    const body = await req.json();
    const { 
        _id, name, domain, image, payout, payout_type, 
        payout_categories, important_info_html, conversion_flow, cookie_duration, isHidden 
    } = body;

    if (!name || !domain || !payout) {
      return NextResponse.json({ success: false, message: "Name, Domain aur Payout zaroori hai!" }, { status: 400 });
    }

    if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI);

    const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim();
    const campaignId = `SANKMO_${cleanDomain}`;

    // Categories string ko properly format karna
    let categoriesArray = [];
    if (typeof payout_categories === 'string' && payout_categories.trim() !== "") {
        const parts = payout_categories.split(',');
        parts.forEach(p => {
            if (p.includes(':')) {
                const [cName, cRate] = p.split(':');
                categoriesArray.push({ name: cName.trim(), payout: cRate.trim() });
            } else {
                categoriesArray.push({ name: p.trim(), payout: "" });
            }
        });
    } else if (Array.isArray(payout_categories)) {
        categoriesArray = payout_categories; 
    }

    const storeData = {
        campaignId: campaignId,
        name, domain: cleanDomain,
        image: image || "",
        payout, payout_type: payout_type || "Sale",
        isManual: true, 
        isHidden: isHidden || false,
        countries: [{ name: "India", iso: "IN" }], 
        payout_categories: categoriesArray,
        important_info_html: important_info_html || "Powered by Deep-linking for High Conversions.",
        conversion_flow: conversion_flow || "User clicks link -> Opens App -> Purchases -> Commission Added",
        cookie_duration: cookie_duration || "App Default"
    };

    let updatedStore;
    if (_id) {
        // UPDATE Existing (Jab aap Table se Edit dabayenge)
        updatedStore = await StoreRate.findByIdAndUpdate(_id, storeData, { new: true });
    } else {
        // CREATE New (Jab aap naya store form se add karenge)
        updatedStore = await StoreRate.findOneAndUpdate({ campaignId: campaignId }, storeData, { new: true, upsert: true });
    }

    return NextResponse.json({ success: true, message: `${name} safely saved!`, data: updatedStore });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}