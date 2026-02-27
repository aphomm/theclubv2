export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-12">
          <div className="text-2xl font-light tracking-extra-wide mb-8">
            <span className="text-stone-100">IC</span>
            <span className="text-amber-600">WT</span>
          </div>
          <h1 className="text-4xl font-light font-serif mb-4">Privacy Policy</h1>
          <p className="text-stone-400 font-light text-sm">Last updated: February 27, 2026</p>
        </div>

        <div className="space-y-10 font-light text-stone-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-light font-serif text-stone-100 mb-4">1. Information We Collect</h2>
            <p className="mb-3">We collect information you provide directly:</p>
            <ul className="list-disc list-inside space-y-1 text-stone-400 ml-4">
              <li>Account information (name, email, phone, location)</li>
              <li>Profile information (bio, role, professional background)</li>
              <li>Payment information (processed securely by Stripe — we do not store card numbers)</li>
              <li>Studio booking records and attendance history</li>
              <li>Messages and communications within the platform</li>
              <li>Google Calendar data (only if you choose to connect)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-light font-serif text-stone-100 mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1 text-stone-400 ml-4">
              <li>To provide and manage your membership</li>
              <li>To process payments and send receipts</li>
              <li>To facilitate connections between members</li>
              <li>To send platform notifications and updates</li>
              <li>To improve the Service and user experience</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-light font-serif text-stone-100 mb-4">3. Information Sharing</h2>
            <p className="mb-3">
              We do not sell your personal information. We share data only with:
            </p>
            <ul className="list-disc list-inside space-y-1 text-stone-400 ml-4">
              <li>
                <strong className="text-stone-300">Other members</strong> — your name, role, location, and bio
                are visible in the member directory
              </li>
              <li>
                <strong className="text-stone-300">Stripe</strong> — for payment processing
              </li>
              <li>
                <strong className="text-stone-300">Supabase</strong> — our database and authentication provider
              </li>
              <li>
                <strong className="text-stone-300">Legal authorities</strong> — when required by law
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-light font-serif text-stone-100 mb-4">4. Data Security</h2>
            <p>
              We use industry-standard security measures including encrypted connections (HTTPS/TLS),
              row-level security on our database, and secure token-based authentication.
              Payment information is handled entirely by Stripe and subject to their PCI-DSS compliance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light font-serif text-stone-100 mb-4">5. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 text-stone-400 ml-4">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Opt out of non-essential communications</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact us at{' '}
              <span className="text-amber-600">privacy@icwt.club</span>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light font-serif text-stone-100 mb-4">6. Data Retention</h2>
            <p>
              We retain your data for as long as your membership is active and for up to 2 years
              afterward for legal and accounting purposes. Booking records and financial data may
              be retained for up to 7 years as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light font-serif text-stone-100 mb-4">7. Cookies</h2>
            <p>
              We use essential cookies for authentication and session management. We do not use
              tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light font-serif text-stone-100 mb-4">8. Changes to This Policy</h2>
            <p>
              We may update this policy periodically. Material changes will be communicated via email
              or platform notification at least 14 days before taking effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light font-serif text-stone-100 mb-4">9. Contact</h2>
            <p>
              For privacy-related questions, contact us at{' '}
              <span className="text-amber-600">privacy@icwt.club</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
