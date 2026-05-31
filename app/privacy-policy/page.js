import Link from 'next/link';
import CompactFooter from '../../components/CompactFooter';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      
      {/* ========================================== */}
      {/* NAVBAR FOR LEGAL PAGES */}
      {/* ========================================== */}
      <nav className="w-full bg-white border-b border-slate-200 z-50 sticky top-0 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Flat PNG Logo Only */}
          <Link href="/" className="flex items-center cursor-pointer">
            <img 
              src="https://pluspng.com/img-png/logo-flipkart-png-flipkart-logo-5000.png" 
              className="h-8 sm:h-10 w-auto object-contain" 
              alt="FavyLink Logo" 
            />
          </Link>

          {/* Navigation Buttons (Home & Dashboard) */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/" className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors bg-slate-100 hover:bg-blue-50 px-3 sm:px-4 py-2 rounded-full">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              <span className="hidden sm:inline">Home</span>
            </Link>
            
            <Link href="/creators" className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white transition-colors bg-blue-600 hover:bg-blue-700 px-3 sm:px-4 py-2 rounded-full shadow-md shadow-blue-500/20">
              <span>Dashboard</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
          </div>

        </div>
      </nav>

      {/* ========================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================== */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10 sm:py-16">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 sm:p-12">
          
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-slate-500 font-medium mb-8 pb-8 border-b border-slate-100">Effective Date: [Current Date]</p>

          <div className="space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">
            
            <p>
              Welcome to FavyLink (favylink.com). Your privacy and data security are critically important to us. This comprehensive Privacy Policy outlines how FavyLink (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) collects, uses, shares, and protects the information of our registered Creators (&quot;you,&quot; &quot;your&quot;) as well as the audience and visitors (&quot;Followers&quot;) interacting with your FavyLink storefronts.
            </p>
            <p>
              By accessing, registering, or using the FavyLink platform, you consent to the data practices described in this Privacy Policy.
            </p>

            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">1. Information We Collect from Creators (Registered Users)</h2>
              <p className="mb-3">To provide our storefront services, generate affiliate links, and process your payout earnings, we collect specific information when you register and operate your account:</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 marker:text-blue-500">
                <li><strong className="text-slate-800">Personal Identification Information:</strong> Your full legal name, active email address, and mobile number.</li>
                <li><strong className="text-slate-800">Public Profile Information:</strong> Your chosen FavyLink username and your social media handles (e.g., Instagram, YouTube, Facebook, Telegram) used for account verification and storefront display.</li>
                <li><strong className="text-slate-800">Financial Data (For Payouts Only):</strong> Your Bank Account details or UPI ID. Note: This highly sensitive data is encrypted, securely stored, and utilized strictly for the sole purpose of disbursing your approved affiliate commissions. We do not use this data for any other purpose.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">2. Information We Collect from Followers (Storefront Visitors)</h2>
              <p className="mb-3">FavyLink provides Creators with an analytics dashboard to track their performance. To do this, we collect non-personally identifiable information (Non-PII) from the followers who visit your FavyLink page:</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 marker:text-blue-500">
                <li><strong className="text-slate-800">Device & Network Analytics:</strong> We collect the visitor&apos;s IP address, browser type (e.g., Chrome, Safari), operating system (e.g., iOS, Android), and device type (Mobile or Desktop).</li>
                <li><strong className="text-slate-800">Interaction & Engagement Data:</strong> We track page views, click-through rates (CTR), timestamps of clicks, and the specific outbound product links a follower clicks on.</li>
                <li><strong className="text-slate-800">Strict Privacy Boundary:</strong> We do not collect, ask for, or store any personal identification data (such as names, emails, or phone numbers) from the followers simply browsing or clicking links on a Creator&apos;s FavyLink storefront.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">3. Cookies and Third-Party Affiliate Tracking</h2>
              <p className="mb-3">FavyLink utilizes cookies and similar tracking technologies to ensure seamless platform operation and accurate commission tracking.</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 marker:text-blue-500">
                <li><strong className="text-slate-800">Internal FavyLink Cookies:</strong> We use strictly necessary cookies to keep Creators logged securely into their dashboards and to remember site preferences.</li>
                <li><strong className="text-slate-800">Affiliate Partner Cookies (Amazon, Flipkart, Myntra, etc.):</strong> When a Follower clicks on a product link on a FavyLink storefront, they are redirected to a third-party partner brand&apos;s website or app. At that moment, the partner brand drops its own tracking cookie on the Follower&apos;s device. This cookie is what allows the retailer to track the sale and attribute the commission to the Creator. FavyLink does not control the duration, privacy practices, or data collection methods of these external retail partner cookies.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">4. How We Use the Collected Information</h2>
              <p className="mb-3">We utilize the data we collect for the following operational purposes:</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 marker:text-blue-500">
                <li><strong className="text-slate-800">Service Delivery:</strong> To create, customize, and maintain your FavyLink storefront.</li>
                <li><strong className="text-slate-800">Financial Processing:</strong> To track Cost Per Sale (CPS) affiliate conversions and process your withdrawal requests accurately.</li>
                <li><strong className="text-slate-800">Platform Improvement:</strong> To analyze traffic patterns, fix bugs, and enhance the overall user experience.</li>
                <li><strong className="text-slate-800">Security & Fraud Prevention:</strong> To monitor unnatural clicking patterns, detect bot traffic, and enforce our Anti-Fraud policies.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">5. Data Sharing & Third-Party Affiliate Aggregators</h2>
              <p className="mb-3">We are firmly committed to protecting your data. FavyLink does not sell, rent, or trade your personal information to marketers or advertisers.</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 marker:text-blue-500">
                <li><strong className="text-slate-800">Integration with Aggregators:</strong> To fetch the highest-paying deals and enable automated link conversions, FavyLink routes traffic through trusted third-party affiliate aggregator networks.</li>
                <li><strong className="text-slate-800">Strict Data Isolation:</strong> We maintain a strict boundary with these third-party tools. We do not share your sensitive personal or financial data (such as your email, mobile number, bank details, or UPI ID) with these aggregators.</li>
                <li><strong className="text-slate-800">Public Identifier Only:</strong> The only data parameter shared with our third-party aggregator partners is your unique FavyLink Username. This acts as a standard public identifier to properly track and attribute your generated links back to your account.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">6. Data Security Measures</h2>
              <p>
                We implement robust, industry-standard security protocols to protect your personal and financial information against unauthorized access, alteration, disclosure, or destruction. However, please be aware that no method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your data, we cannot guarantee its absolute security.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">7. Data Retention</h2>
              <p>
                We retain your personal information only for as long as your FavyLink account is active, or as needed to provide you with our services, comply with legal obligations, resolve disputes, and enforce our agreements.
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">8. Your Rights & Account Control</h2>
              <p className="mb-3">As a registered Creator, you have full control over your data:</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 marker:text-blue-500">
                <li><strong className="text-slate-800">Access & Update:</strong> You can access, update, or correct your personal and financial information directly from your FavyLink dashboard at any time.</li>
                <li><strong className="text-slate-800">Account Deletion:</strong> You have the right to request the permanent deletion of your FavyLink account and associated data. Upon deletion, all pending earnings will be subject to our standard closure policies.</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">9. Changes to This Privacy Policy</h2>
              <p>
                FavyLink reserves the right to update or modify this Privacy Policy at any time to reflect changes in legal requirements, technology advancements, or platform features. We will notify active users of any significant changes via the email address associated with their account or through a prominent notice on the dashboard.
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">10. Contact Us</h2>
              <p>If you have any questions, concerns, or requests regarding this Privacy Policy or how your data is handled, please reach out to our privacy and support team at:</p>
              <p className="mt-2 font-bold text-blue-600 text-lg">Email: support@favylink.com</p>
            </section>

          </div>
        </div>
      </main>

      {/* ========================================== */}
      {/* COMPACT REUSABLE FOOTER */}
      {/* ========================================== */}
      <CompactFooter />

    </div>
  );
}