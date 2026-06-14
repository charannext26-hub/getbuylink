import { NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/lib/models/User"; // Dhyan rahe, ye aapke User/Creator model ka path ho

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const username = searchParams.get("username");

        if (!username) return NextResponse.json({ error: "Username is required" }, { status: 400 });
        if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI);

        // Creator ka data fetch karo
        const creator = await User.findOne({ username: username });

        // Agar creator mil gaya, toh uska naam aur image use karo, warna default FavyLink use karo
        const appName = creator && creator.name ? `${creator.name} Deals` : "FavyLink";
        const appIcon = creator && creator.image ? creator.image : "/icon-192x192.png"; 

        // Dynamic Manifest JSON format
        const manifest = {
            name: appName,
            short_name: appName,
            description: `Exclusive deals and offers curated by ${appName}`,
            start_url: `/${username}`, // Direct creator ke page par open hoga
            display: "standalone",
            background_color: "#ffffff",
            theme_color: "#10b981", // Emerald color (Aap isko apne theme ke hisaab se change kar sakte ho)
            icons: [
                {
                    src: appIcon,
                    sizes: "192x192",
                    type: "image/png",
                    purpose: "any maskable"
                },
                {
                    src: appIcon,
                    sizes: "512x512",
                    type: "image/png",
                    purpose: "any maskable"
                }
            ]
        };

        // Browser ko batana ki ye normal JSON nahi, ek "Manifest" file hai
        return new NextResponse(JSON.stringify(manifest), {
            status: 200,
            headers: {
                "Content-Type": "application/manifest+json",
                "Cache-Control": "public, max-age=3600",
            },
        });

    } catch (error) {
        console.error("Manifest Generation Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}