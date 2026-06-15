import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import crypto from "crypto";

export async function POST(req) {
  try {
    // 🚀 BUG FIXED: Mongoose direct connect ki jagah optimized file use ki
    await connectToDatabase();

    const { name, email, password } = await req.json();

    // 2. Validation
    if (!email || !password || !name) {
      return NextResponse.json({ success: false, message: "All fields are required." }, { status: 400 });
    }

    // 3. Check karein ki user pehle se toh nahi hai
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ success: false, message: "Email is already registered. Please sign in." }, { status: 400 });
    }

    // 4. Password ko secure (Hash) karein
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Ek secret Verification Token banayein
    const verifyToken = crypto.randomBytes(32).toString("hex");

    // 6. Naya User Database mein save karein (isVerified: false ke sath)
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "creator", // Aapka default role
      isVerified: false,
      verifyToken,
      verifyTokenExpiry: Date.now() + 3600000, // Token 1 hour validity
    });

    // 7. Nodemailer se Hostinger SMTP ke zariye Email bhejna
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com", 
      port: 465, 
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verification Link generate karna
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/api/verify?token=${verifyToken}&email=${email}`;

    // Email ka Design
    const mailOptions = {
      from: `"FavyLink Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your FavyLink Account",
      html: `
        <div style="font-family: Arial, sans-serif; max-w: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #0f172a; margin: 0; font-size: 24px;">Favy<span style="color: #2563EB;">Link</span></h2>
          </div>
          <h3 style="color: #333; text-align: center;">Welcome to the Creator Hub!</h3>
          <p style="color: #555; font-size: 15px;">Hi <strong>${name}</strong>,</p>
          <p style="color: #555; font-size: 15px; line-height: 1.5;">Thank you for registering on FavyLink. To complete your setup and access your dashboard, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background-color: #2563EB; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Verify Email Address</a>
          </div>
          
          <p style="color: #777; font-size: 13px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563EB; font-size: 13px;">${verifyUrl}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    // Email send trigger
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: "Account created! Verification email sent." }, { status: 201 });

  } catch (error) {
    console.error("Signup/Email Error:", error);
    return NextResponse.json({ success: false, message: "Server error occurred while creating account." }, { status: 500 });
  }
}
