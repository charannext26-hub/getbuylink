import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials"; 
import User from "@/lib/models/User";
import bcrypt from "bcryptjs"; 
import connectToDatabase from "@/lib/mongodb"; 

export const authOptions = {
  providers: [
    // --- 1. GOOGLE LOGIN ---
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    // --- 2. EMAIL & PASSWORD LOGIN (Credentials) ---
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        await connectToDatabase();
        const user = await User.findOne({ email: credentials.email });

        // Agar email nahi mila
        if (!user) throw new Error("No account found with this email!");
        
        // Agar Google se signup kiya tha (password nahi hai)
        if (!user.password) throw new Error("You previously signed up with Google. Please use 'Continue with Google'.");
        
        // Password check karein
        const isPasswordMatch = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordMatch) throw new Error("Incorrect Password!");

        // 🚨 THE FIX: Verification Check
        if (user.isVerified === false) {
            throw new Error("Please verify your email before logging in. Check your inbox for the verification link.");
        }

        // Sab theek hai toh data bhejo
        return { id: user._id.toString(), name: user.name, email: user.email };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (account.provider === "google") {
        try {
          await connectToDatabase();

          const userExists = await User.findOne({ email: user.email });

          if (!userExists) {
            await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
              isVerified: true, // 🚨 NAYA: Google accounts automatically verified maane jayenge
            });
            console.log("Naya Creator Database mein Save ho gaya! 🎉");
          } else if (userExists.isVerified === false) {
             // Agar kisi ne manual email daali thi par verify nahi ki, aur ab Google se aa gaya, 
             // toh usko verified mark kar do.
             userExists.isVerified = true;
             await userExists.save();
          }
          
          return true; 
        } catch (error) {
          console.log("Database mein save karte waqt error aaya: ", error);
          return false; 
        }
      }
      
      return true;
    },

    async jwt({ token, user, trigger }) { 
      if (user) {
        token.id = user.id;
        
        await connectToDatabase();
        const dbUser = await User.findOne({ email: user.email });
        token.username = dbUser?.username || null;
      }

      if (trigger === "update") {
        await connectToDatabase();
        const dbUser = await User.findOne({ email: token.email });
        token.username = dbUser?.username || null; 
      }

      return token;
    },
    
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username; 
      }
      return session;
    }
  },
  pages: {
    signIn: '/login', 
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };