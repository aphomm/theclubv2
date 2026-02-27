export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-12">
          <div className="text-2xl font-light tracking-extra-wide mb-8">
            <span className="text-stone-100">IC</span>
            <span className="text-amber-600">WT</span>
          </div>
          <h1 className="text-4xl font-light font-serif mb-4">Terms of Service</h1>
          <p className="text-stone-400 font-light text-sm">Last updated: February 27, 2026</p>
        </div>

        <div className="space-y-10 font-light text-stone-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-light font-serif text-stone-100 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the ICWT membership platform ("Service"), you agree to be bound by
              these Terms of Service. If you do not agree to these terms, you may not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light font-serif text-stone-100 mb-4">2. Membership</h2>
            <p className="mb-3">
              ICWT offers tiered membership plans (Creator, Professional, Executive) with access to
              exclusive amenities, events, studio time, and the Pool investment platform.
              Membership is subject to approval and may be revoked for violations of these terms.
            </p>
            <p>
              Members are responsible for all activity under their account. Membership fees are
              non-refundable except where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light font-serif text-stone-100 mb-4">3. Studio Booking Policy</h2>
            <p className="mb-3">
              Studio hours are allocated monthly based on your membership tier and do not roll over.
              Cancellations made with less than 24 hours notice result in forfeited hours.
            </p>
            <p>
              Three late cancellations within a billing period may result in temporary suspension of
              booking privileges.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light font-serif text-stone-100 mb-4">4. The Pool Platform</h2>
            <p>
              The Pool is a collaborative investment and project platform for members. ICWT does not
              provide financial advice. All investment decisions are made at your own risk. Equity
              agreements are between project participants and are governed by separately executed agreements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light font-serif text-stone-100 mb-4">5. Code of Conduct</h2>
            <p className="mb-3">
              Members agree to treat all other members and staff with respect. Harassment, discrimination,
              or disruptive behavior will result in immediate termination of membership without refund.
            </p>
            <p>
              Members may not share access credentials, solicit other members for unauthorized
              commercial purposes, or engage in any activity that damages the reputation of ICWT.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light font-serif text-stone-100 mb-4">6. Intellectual Property</h2>
            <p>
              Content you create and share on the platform remains your property. By sharing content,
              you grant ICWT a limited license to display it within the platform. ICWT's branding,
              design, and platform code are proprietary and may not be reproduced without permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light font-serif text-stone-100 mb-4">7. Limitation of Liability</h2>
            <p>
              ICWT is not liable for any indirect, incidental, or consequential damages arising from
              your use of the Service. Our total liability shall not exceed the amount you paid for
              membership in the three months prior to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light font-serif text-stone-100 mb-4">8. Changes to Terms</h2>
            <p>
              We may update these terms at any time. Continued use of the Service after changes
              constitutes acceptance of the updated terms. Material changes will be communicated
              via email or platform notification.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light font-serif text-stone-100 mb-4">9. Contact</h2>
            <p>
              For questions about these terms, contact us at{' '}
              <span className="text-amber-600">legal@icwt.club</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
