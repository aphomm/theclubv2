'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success('Successfully joined the waitlist!');
        setEmail('');
      } else {
        toast.error(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
    setIsSubmitting(false);
  };


  return (
    <div className="min-h-screen bg-ink-950 text-ink-100">

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-ink-800 bg-ink-950">
        <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="font-serif text-2xl uppercase leading-none tracking-tight">
            ICWT<span className="text-signal">.</span>
          </a>
          <div className="hidden md:flex items-center gap-10 font-mono text-xs uppercase tracking-wider text-ink-400">
            <a href="#about" className="hover:text-ink-100 transition-colors">About</a>
            <a href="#membership" className="hover:text-ink-100 transition-colors">Membership</a>
            <a href="#features" className="hover:text-ink-100 transition-colors">Features</a>
          </div>
          <div className="flex items-center gap-6">
            <a href="/auth/login" className="text-sm text-ink-300 hover:text-ink-100 transition-colors">
              Sign in
            </a>
            <a
              href="#membership"
              className="bg-accent-500 text-ink-950 px-5 py-2.5 text-sm font-medium hover:bg-white transition-colors rounded-sm"
            >
              Apply
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative min-h-[92vh] flex flex-col justify-end pt-32 pb-10 px-6 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{ backgroundImage: 'url(/images/weplay-interior.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/30" />

        <div className="max-w-7xl w-full mx-auto relative">
          <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-wider text-ink-300 mb-8">
            <span>Inglewood, California</span>
            <span className="text-ink-500">1500 or Nothin&apos; &times; WePlay Studios</span>
          </div>

          <h1 className="text-[17vw] md:text-[13vw] lg:text-[11rem] leading-[0.85] mb-10">
            In Culture<br />
            We Trust<span className="text-signal">.</span>
          </h1>

          <div className="grid md:grid-cols-12 gap-8 items-end">
            <p className="md:col-span-6 text-lg text-ink-300 leading-relaxed">
              A private cultural membership at the intersection of music, tech, film, fashion, sports, wellness, and aerospace. ICWT is the front door into the 1500 or Nothin&apos; &times; WePlay Studios cultural operating system, where the most influential creators and operators gather to build, connect, and own.
            </p>
            <div className="md:col-span-6 flex md:justify-end gap-4">
              <a
                href="#membership"
                className="bg-accent-500 text-ink-950 px-8 py-4 text-sm font-medium hover:bg-white transition-colors rounded-sm"
              >
                Apply for Membership
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl w-full mx-auto relative mt-16 pt-5 border-t border-ink-800 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-ink-500">
          {['Music', 'Tech', 'Film', 'Fashion', 'Sports', 'Wellness', 'Aerospace'].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 border-t border-ink-800">
        <div className="max-w-7xl mx-auto">
          <SectionLabel n="01">What you get</SectionLabel>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 border-t border-ink-800">
            {[
              {
                title: 'Elite Network',
                desc: 'Connect with Grammy winners, platinum producers, and label executives shaping the industry.',
              },
              {
                title: 'Exclusive Events',
                desc: 'Private listening sessions, industry masterclasses, and invite-only networking experiences.',
              },
              {
                title: 'Studio Access',
                desc: 'World-class recording facilities at WePlay Studios with professional-grade equipment.',
              },
              {
                title: 'Collaborative IP',
                desc: 'Pool resources on projects with transparent equity tracking and profit distribution.',
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className="pt-6 pb-10 md:pr-8 border-b border-ink-800 lg:border-b-0 lg:[&:not(:first-child)]:border-l lg:[&:not(:first-child)]:pl-8"
              >
                <div className="font-mono text-xs text-ink-500 mb-10">{String(i + 1).padStart(2, '0')}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-ink-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-32 px-6 border-t border-ink-800">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-3">
            <SectionLabel n="02">Our philosophy</SectionLabel>
          </div>
          <div className="lg:col-span-9">
            <h2 className="text-6xl md:text-8xl mb-12">
              Built for the culture,<br />
              <span className="text-ink-500">by the culture.</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-8 text-lg text-ink-300 leading-relaxed">
              <p>
                ICWT is a movement of creators who believe in collective success, shared equity, and building generational wealth through collaboration.
              </p>
              <p>
                It was born from the legacy of 1500 Or Nothin&apos;, the collective that shaped the sound of a generation. This is where the culture&apos;s next chapter gets written.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Platform */}
      <section className="py-24 px-6 border-t border-ink-800">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <SectionLabel n="03">The platform</SectionLabel>
            <h2 className="text-5xl md:text-6xl mb-6">Your creative operations center</h2>
            <p className="text-lg text-ink-400 mb-10 leading-relaxed">
              Book studio time, RSVP to events, connect with members, and manage collaborative projects from one dashboard, built around how the music industry actually works.
            </p>
            <a
              href="/auth/signup"
              className="inline-block bg-accent-500 text-ink-950 px-8 py-4 text-sm font-medium hover:bg-white transition-colors rounded-sm"
            >
              Get Access
            </a>
          </div>
          <div className="lg:col-span-6 lg:col-start-7 border-t border-ink-800">
            {[
              { name: 'Studio', desc: 'Book hours across three rooms at WePlay' },
              { name: 'Events', desc: 'RSVP to listening sessions and masterclasses' },
              { name: 'Directory', desc: 'Find and message other members' },
              { name: 'The Pool', desc: 'Fund and co-own projects together' },
              { name: 'Resources', desc: 'The member resource library' },
            ].map((row, i) => (
              <div key={row.name} className="grid grid-cols-12 gap-4 py-5 border-b border-ink-800 items-baseline">
                <span className="col-span-2 font-mono text-xs text-ink-500">{String(i + 1).padStart(2, '0')}</span>
                <span className="col-span-4 font-semibold">{row.name}</span>
                <span className="col-span-6 text-sm text-ink-400">{row.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Tiers */}
      <section id="membership" className="py-24 px-6 border-t border-ink-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div>
              <SectionLabel n="04">Membership</SectionLabel>
              <h2 className="text-5xl md:text-7xl">Three tiers</h2>
            </div>
            <p className="text-ink-400 max-w-sm">
              Pick the level that matches where you are right now. Every application is reviewed.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-px bg-ink-800 border border-ink-800">
            {[
              {
                name: 'Creator',
                price: '$500',
                for: 'For emerging artists and producers',
                href: '/auth/signup?tier=creator',
                items: [
                  'Basic access to networking events',
                  'Member directory access',
                  'Quarterly masterclasses',
                  'Resource library access',
                ],
              },
              {
                name: 'Professional',
                price: '$1,200',
                for: 'For established professionals',
                href: '/auth/signup?tier=professional',
                featured: true,
                items: [
                  'Everything in Creator, plus',
                  '10 studio hours per month',
                  'VIP event access',
                  'Collaboration matching',
                  'Pool platform access',
                ],
              },
              {
                name: 'Executive',
                price: '$2,500',
                for: 'For industry executives',
                href: '/auth/signup?tier=executive',
                items: [
                  'Everything in Professional, plus',
                  '20 studio hours per month',
                  'Executive lounge access',
                  'Priority Pool investments',
                  '1-on-1 advisory sessions',
                ],
              },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`flex flex-col p-8 md:p-10 ${tier.featured ? 'bg-accent-500 text-ink-950' : 'bg-ink-950'}`}
              >
                <div className="flex items-baseline justify-between mb-10">
                  <h3 className="text-2xl font-semibold">{tier.name}</h3>
                  {tier.featured && (
                    <span className="font-mono text-[11px] uppercase tracking-wider">Recommended</span>
                  )}
                </div>
                <div className="font-serif text-7xl leading-none mb-2">
                  {tier.price}
                  <span className={`font-mono font-normal text-sm ml-1 ${tier.featured ? 'text-ink-600' : 'text-ink-500'}`}>/mo</span>
                </div>
                <p className={`mb-10 ${tier.featured ? 'text-ink-700' : 'text-ink-400'}`}>{tier.for}</p>
                <ul className={`mb-12 border-t ${tier.featured ? 'border-ink-950/15' : 'border-ink-800'}`}>
                  {tier.items.map((item) => (
                    <li
                      key={item}
                      className={`py-3 border-b text-sm ${tier.featured ? 'border-ink-950/15' : 'border-ink-800 text-ink-300'}`}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href={tier.href}
                  className={`mt-auto block text-center py-3.5 text-sm font-medium transition-colors rounded-sm ${
                    tier.featured
                      ? 'bg-ink-950 text-ink-100 hover:bg-ink-800'
                      : 'border border-ink-600 hover:border-ink-100'
                  }`}
                >
                  Apply Now
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Pool */}
      <section className="py-24 px-6 border-t border-ink-800">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5">
            <SectionLabel n="05">The Pool</SectionLabel>
            <h2 className="text-5xl md:text-6xl mb-6">Build. Fund. Own. Together.</h2>
            <p className="text-lg text-ink-400 mb-10 leading-relaxed">
              A collaborative project platform where members pool resources to fund albums, tours, and ventures.
              Contribute cash, time, or equipment in exchange for transparent equity ownership and profit sharing.
            </p>
            <a
              href="#membership"
              className="inline-block border border-ink-600 px-8 py-4 text-sm font-medium hover:border-ink-100 transition-colors rounded-sm"
            >
              Learn More
            </a>
          </div>

          <div className="lg:col-span-6 lg:col-start-7 border border-ink-800">
            <div className="flex justify-between px-5 py-3 border-b border-ink-800 font-mono text-[11px] uppercase tracking-wider text-ink-500">
              <span>Example projects</span>
              <span>Raised / Goal</span>
            </div>
            {[
              { title: 'Summer EP Campaign', category: 'Music', raised: 18, goal: 25, pct: 72 },
              { title: 'Inglewood Doc Series', category: 'Film', raised: 41, goal: 60, pct: 68 },
              { title: 'Producer Masterclass Tour', category: 'Education', raised: 9, goal: 15, pct: 60 },
            ].map((proj) => (
              <div key={proj.title} className="px-5 py-5 border-b border-ink-800 last:border-b-0">
                <div className="flex items-baseline justify-between gap-4 mb-3">
                  <div>
                    <div className="font-semibold">{proj.title}</div>
                    <div className="font-mono text-[11px] uppercase tracking-wider text-ink-500 mt-1">{proj.category}</div>
                  </div>
                  <div className="font-mono text-sm text-right shrink-0">
                    ${proj.raised}K <span className="text-ink-500">/ ${proj.goal}K</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-ink-800 h-1">
                    <div className="bg-accent-500 h-full" style={{ width: `${proj.pct}%` }} />
                  </div>
                  <span className="font-mono text-[11px] text-ink-400 w-8 text-right">{proj.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 border-t border-ink-800">
        <div className="max-w-7xl mx-auto">
          <SectionLabel n="06">In their words</SectionLabel>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                quote: 'If I were to explain 1500, we\'re like the X-Men when it comes to entertainment and music. It\'s a conglomerate of talented people that grew up together.',
                name: 'Larrance Dopson',
                title: 'Founder, 1500 Or Nothin\'',
              },
              {
                quote: 'Thundercat was part of the group. Terrace Martin—you wouldn\'t believe all the successful people that have come through it.',
                name: 'On 1500 Or Nothin\'',
                title: 'Grammy-Winning Collective',
              },
              {
                quote: 'The Academy is my number one priority because everyone in the music business has had such a rough road. I want to make it easier for everybody.',
                name: 'Larrance Dopson',
                title: 'On 1500 Sound Academy',
              },
            ].map((t, i) => (
              <figure key={i} className="border-t border-ink-600 pt-6 flex flex-col">
                <blockquote className="text-xl leading-snug text-ink-200 mb-8">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-auto">
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="font-mono text-[11px] uppercase tracking-wider text-ink-500 mt-1">{t.title}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="py-24 px-6 border-t border-ink-800">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <SectionLabel n="07">The space</SectionLabel>
            <h2 className="text-5xl md:text-6xl mb-6">In the heart of Inglewood</h2>
            <p className="text-lg text-ink-300 mb-6 leading-relaxed">
              WePlay Studios sits at the intersection of culture and commerce, minutes from SoFi Stadium and
              the Forum. This is where the West Coast music scene comes alive.
            </p>
            <p className="text-ink-400 mb-10 leading-relaxed">
              Our 15,000 sq ft facility features three recording studios, a conference center,
              an executive lounge, and collaborative workspaces designed for creativity.
            </p>
            <a
              href="#membership"
              className="inline-block border border-ink-600 px-8 py-4 text-sm font-medium hover:border-ink-100 transition-colors rounded-sm"
            >
              Tour the Space
            </a>
          </div>
          <figure className="lg:col-span-7">
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src="/images/weplay-exterior.png"
                alt="WePlay Studios Exterior"
                className="w-full h-full object-cover"
              />
            </div>
            <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-wider text-ink-500">
              WePlay Studios, Inglewood CA
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 px-6 border-t border-ink-800">
        <div className="max-w-7xl mx-auto">
          <SectionLabel n="08">Leadership &amp; advisors</SectionLabel>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                img: '/images/larrance-dopson.jpg',
                name: 'Larrance "Rance" Dopson',
                role: '4x Grammy Award Winner',
                org: 'Founder of 1500 Or Nothin\'',
              },
              {
                img: '/images/max-bilonogov.webp',
                name: 'Max Bilonogov',
                role: 'Chief Visionary Officer',
                org: 'WePlay Studios',
              },
            ].map((person) => (
              <div key={person.name}>
                <div className="aspect-[4/5] mb-5 overflow-hidden bg-ink-900">
                  <img
                    src={person.img}
                    alt={person.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <h3 className="text-lg font-semibold">{person.name}</h3>
                <div className="text-sm text-ink-300 mt-1">{person.role}</div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-ink-500 mt-2">{person.org}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist CTA */}
      <section className="py-24 px-6 border-t border-ink-800">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-6">
            <h2 className="text-6xl md:text-8xl mb-4">Join the waitlist</h2>
            <p className="text-lg text-ink-400">
              Be the first to know when new membership spots open.
            </p>
          </div>
          <form onSubmit={handleWaitlistSubmit} className="lg:col-span-6 flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="flex-1 bg-transparent border border-ink-600 px-5 py-4 text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-ink-100 rounded-sm transition-colors"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-accent-500 text-ink-950 px-10 py-4 text-sm font-medium hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-800 px-6">
        <div className="max-w-7xl mx-auto py-10 grid md:grid-cols-3 gap-6 items-end">
          <div className="font-serif text-5xl uppercase leading-none tracking-tight">
            ICWT<span className="text-signal">.</span>
          </div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-500 space-y-1">
            <div>Inglewood, California</div>
            <div>&copy; 2026 In Culture We Trust</div>
          </div>
          <div className="flex md:justify-end gap-6 font-mono text-[11px] uppercase tracking-wider text-ink-500">
            <a href="/legal/terms" className="hover:text-ink-100 transition-colors">Terms</a>
            <a href="/legal/privacy" className="hover:text-ink-100 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionLabel({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 font-mono text-xs uppercase tracking-wider text-ink-400 mb-8">
      <span className="text-ink-600">{n}</span>
      <span>{children}</span>
    </div>
  );
}
