'use client';

import { useState, useEffect } from 'react';
import { MapPin, Network, Calendar, Briefcase, Star, Check, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      toast.error('Please configure Supabase credentials');
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from('waitlist').insert([{ email }]);

    if (error) {
      if (error.code === '23505') {
        toast.error('This email is already on the waitlist');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } else {
      toast.success('Successfully joined the waitlist!');
      setEmail('');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-stone-950/80 backdrop-blur-md">
        <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="text-2xl font-light tracking-extra-wide">
            <span className="text-stone-100">IC</span>
            <span className="text-amber-600">WT</span>
          </div>
          <div className="hidden md:flex items-center gap-12 text-sm font-light tracking-wide">
            <a href="#about" className="hover:text-amber-600 transition-colors">About</a>
            <a href="#membership" className="hover:text-amber-600 transition-colors">Membership</a>
            <a href="#features" className="hover:text-amber-600 transition-colors">Features</a>
          </div>
          <a href="#membership">
            <button className="bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 px-8 py-3 text-sm font-light tracking-wide hover:opacity-90 transition-opacity rounded-full">
              Apply
            </button>
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-32 px-6 relative overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: 'url(/images/weplay-interior.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/50 via-transparent to-stone-950" />

        {/* Radial hero glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(217,119,6,0.15) 0%, transparent 70%)',
            animation: 'heroGlow 5s ease-in-out infinite',
          }}
        />

        {/* Floating ambient dots */}
        {[
          { top: '22%', left: '8%', delay: '0s', size: 6 },
          { top: '65%', left: '88%', delay: '1.5s', size: 4 },
          { top: '72%', left: '12%', delay: '0.9s', size: 5 },
          { top: '28%', left: '82%', delay: '2.3s', size: 3 },
        ].map((dot, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-amber-600 pointer-events-none"
            style={{
              top: dot.top,
              left: dot.left,
              width: dot.size,
              height: dot.size,
              animation: `floatDot 4s ease-in-out infinite`,
              animationDelay: dot.delay,
            }}
          />
        ))}

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Location tag */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 border border-amber-600/50 text-amber-600 text-xs font-light tracking-extra-wide mb-12"
            data-reveal
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-amber-600"
              style={{ animation: 'pulseDot 2s ease-in-out infinite' }}
            />
            <MapPin className="w-3 h-3" />
            INGLEWOOD, CALIFORNIA
          </div>

          <h1
            className="font-serif text-6xl md:text-7xl lg:text-9xl font-light mb-8 leading-tight"
            data-reveal
            style={{ transitionDelay: '0.1s' }}
          >
            In CULTURE{' '}
            <span className="italic text-amber-600">We TRUST</span>
          </h1>

          <p
            className="text-xl text-stone-400 font-light max-w-3xl mx-auto mb-16 leading-relaxed"
            data-reveal
            style={{ transitionDelay: '0.2s' }}
          >
            A private cultural membership built at the intersection of music, tech, film, fashion, sports, wellness, and aerospace. This isn't just another club – it's the front door into the 1500 or Nothin' × WePlay Studios cultural operating system, where the world's most influential creators and operators gather to build, connect, and own.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            data-reveal
            style={{ transitionDelay: '0.3s' }}
          >
            <a href="#membership">
              <button className="bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 px-12 py-4 text-sm font-light tracking-wide hover:opacity-90 transition-opacity rounded-full">
                Apply for Membership
              </button>
            </a>
          </div>

          {/* Scroll indicator */}
          <div className="mt-20 flex justify-center">
            <ChevronDown className="w-5 h-5 text-stone-500 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5">
            {[
              {
                icon: Network,
                title: 'Elite Network',
                desc: 'Connect with Grammy winners, platinum producers, and label executives shaping the industry.',
              },
              {
                icon: Calendar,
                title: 'Exclusive Events',
                desc: 'Private listening sessions, industry masterclasses, and invite-only networking experiences.',
              },
              {
                icon: Briefcase,
                title: 'Studio Access',
                desc: 'World-class recording facilities at WePlay Studios with professional-grade equipment.',
              },
              {
                icon: Star,
                title: 'Collaborative IP',
                desc: 'Pool resources on projects with transparent equity tracking and profit distribution.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-stone-950 p-10 hover:bg-stone-900/60 transition-colors group"
                data-reveal
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <feature.icon className="w-8 h-8 text-amber-600 mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-light mb-4 tracking-wide">{feature.title}</h3>
                <p className="text-stone-400 font-light leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy / Manifesto */}
      <section id="about" className="py-40 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto text-center" data-reveal>
          <p className="text-xs tracking-extra-wide text-amber-600 mb-10 font-light">OUR PHILOSOPHY</p>
          <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl font-light leading-tight mb-10">
            Built for the culture,<br />
            <span className="italic text-stone-400">by the culture</span>
          </h2>
          <p className="text-xl text-stone-400 font-light max-w-3xl mx-auto leading-relaxed">
            We're more than a membership club. We're a movement of creators who believe in collective success,
            shared equity, and building generational wealth through collaboration.
          </p>
        </div>
      </section>

      {/* Our Belief */}
      <section className="py-40 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto" data-reveal>
          <p className="text-xs tracking-extra-wide text-amber-600 mb-10 font-light">OUR BELIEF</p>
          <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl font-light leading-tight mb-12">
            We're not just a membership.<br />
            <span className="italic text-stone-400">We're a movement of creators</span><br />
            who build generational wealth<br />
            through collaboration.
          </h2>
          <p className="text-xl text-stone-400 font-light max-w-3xl leading-relaxed">
            Born from the legacy of 1500 Or Nothin' — the collective that shaped the sound of a generation — ICWT is where the culture's next chapter gets written.
          </p>
        </div>
      </section>

      {/* The Platform */}
      <section className="py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div data-reveal>
            <p className="text-xs tracking-extra-wide text-amber-600 mb-6 font-light">THE PLATFORM</p>
            <h2 className="text-4xl md:text-5xl font-light mb-6">Your creative operations center</h2>
            <p className="text-xl text-stone-400 font-light mb-10 leading-relaxed">
              Book studio time, RSVP to events, connect with members, and manage collaborative projects — all from a single dashboard designed for how the music industry actually works.
            </p>
            <a href="/auth/signup">
              <button className="bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 px-10 py-4 text-sm font-light tracking-wide hover:opacity-90 transition-opacity rounded-full">
                Get Access
              </button>
            </a>
          </div>
          {/* Mock dashboard preview */}
          <div
            className="rounded-2xl border border-white/[0.08] bg-stone-900/60 overflow-hidden"
            data-reveal
            style={{ transitionDelay: '0.15s' }}
          >
            <div className="border-b border-white/[0.08] px-4 py-3 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="flex-1 mx-4 h-5 rounded-full bg-white/[0.05]" />
            </div>
            <div className="flex h-72">
              <div className="w-40 border-r border-white/[0.08] p-3 flex flex-col gap-1.5 shrink-0">
                {['Dashboard', 'Studio', 'Events', 'The Pool', 'Directory'].map((item, i) => (
                  <div
                    key={item}
                    className={`px-3 py-2 rounded-lg text-xs font-light ${
                      i === 0 ? 'bg-amber-600/20 text-amber-600' : 'text-stone-500'
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="flex-1 p-4 space-y-3 overflow-hidden">
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Studio Hours', value: '10h', accent: true },
                    { label: "Events RSVP'd", value: '3', accent: false },
                    { label: 'Pool Projects', value: '2', accent: false },
                    { label: 'Connections', value: '48', accent: false },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
                      <div className="text-[10px] text-stone-500 mb-1">{stat.label}</div>
                      <div className={`text-base font-light ${stat.accent ? 'text-amber-600' : 'text-stone-200'}`}>{stat.value}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 space-y-2">
                  <div className="text-[10px] text-stone-500 mb-1">Upcoming Events</div>
                  {['Industry Listening Session', 'Producer Masterclass'].map((e) => (
                    <div key={e} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                      <div className="text-[11px] text-stone-400 font-light">{e}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Tiers */}
      <section id="membership" className="py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20" data-reveal>
            <h2 className="text-4xl md:text-5xl font-light mb-6">Choose Your Level</h2>
            <p className="text-xl text-stone-400 font-light">
              Three tiers designed for different stages of your creative journey
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">

            {/* Creator Tier */}
            <div
              className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-10 hover:border-amber-600/30 transition-all"
              data-reveal
              style={{ transitionDelay: '0s' }}
            >
              <div className="mb-8">
                <h3 className="text-2xl font-light mb-2">Creator</h3>
                <div className="text-5xl font-light text-amber-600 mb-4">$500<span className="text-xl text-stone-400">/mo</span></div>
                <p className="text-stone-400 font-light">For emerging artists and producers</p>
              </div>
              <ul className="space-y-4 mb-10">
                {[
                  'Basic access to networking events',
                  'Member directory access',
                  'Quarterly masterclasses',
                  'Resource library access',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-stone-300 font-light">
                    <Check className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="/auth/signup?tier=creator">
                <button className="w-full border border-white/20 py-3 text-sm font-light tracking-wide hover:border-amber-600 hover:text-amber-600 transition-colors rounded-full">
                  Apply Now
                </button>
              </a>
            </div>

            {/* Professional Tier */}
            <div
              className="rounded-2xl border border-amber-600/50 bg-gradient-to-br from-amber-600/10 to-amber-500/5 p-10 relative"
              data-reveal
              style={{ transitionDelay: '0.1s' }}
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 px-6 py-1 text-xs tracking-extra-wide rounded-full whitespace-nowrap">
                MOST POPULAR
              </div>
              <div className="mb-8">
                <h3 className="text-2xl font-light mb-2">Professional</h3>
                <div className="text-5xl font-light text-amber-600 mb-4">$1,200<span className="text-xl text-stone-400">/mo</span></div>
                <p className="text-stone-400 font-light">For established professionals</p>
              </div>
              <ul className="space-y-4 mb-10">
                {[
                  'Everything in Creator, plus',
                  '10 studio hours per month',
                  'VIP event access',
                  'Collaboration matching',
                  'Pool platform access',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-stone-300 font-light">
                    <Check className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="/auth/signup?tier=professional">
                <button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 py-3 text-sm font-light tracking-wide hover:opacity-90 transition-opacity rounded-full">
                  Apply Now
                </button>
              </a>
            </div>

            {/* Executive Tier */}
            <div
              className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-10 hover:border-amber-600/30 transition-all"
              data-reveal
              style={{ transitionDelay: '0.2s' }}
            >
              <div className="mb-8">
                <h3 className="text-2xl font-light mb-2">Executive</h3>
                <div className="text-5xl font-light text-amber-600 mb-4">$2,500<span className="text-xl text-stone-400">/mo</span></div>
                <p className="text-stone-400 font-light">For industry executives</p>
              </div>
              <ul className="space-y-4 mb-10">
                {[
                  'Everything in Professional, plus',
                  '20 studio hours per month',
                  'Executive lounge access',
                  'Priority Pool investments',
                  '1-on-1 advisory sessions',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-stone-300 font-light">
                    <Check className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="/auth/signup?tier=executive">
                <button className="w-full border border-white/20 py-3 text-sm font-light tracking-wide hover:border-amber-600 hover:text-amber-600 transition-colors rounded-full">
                  Apply Now
                </button>
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* The Pool Feature */}
      <section className="py-32 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto" data-reveal>
          <div className="rounded-2xl border border-amber-600/20 p-16 bg-gradient-to-br from-amber-600/8 to-transparent relative overflow-hidden">
            <div
              className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(217,119,6,0.12) 0%, transparent 70%)' }}
            />
            <div className="text-xs tracking-extra-wide text-amber-600 mb-6 relative z-10">INTRODUCING THE POOL</div>
            <h2 className="text-4xl md:text-5xl font-light mb-6 relative z-10">Build. Fund. Own. Together.</h2>
            <p className="text-xl text-stone-400 font-light max-w-2xl mb-10 leading-relaxed relative z-10">
              A collaborative project platform where members pool resources to fund albums, tours, and ventures.
              Contribute cash, time, or equipment in exchange for transparent equity ownership and profit sharing.
            </p>
            <button className="border border-amber-600/60 text-amber-600 px-12 py-4 text-sm font-light tracking-wide hover:bg-amber-600 hover:text-stone-950 transition-colors rounded-full relative z-10">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
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
              <div
                key={i}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 hover:border-amber-600/20 transition-colors"
                data-reveal
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className="font-serif text-7xl text-amber-600/25 leading-none mb-2 select-none">"</div>
                <p className="text-lg italic text-stone-300 font-light mb-6 leading-relaxed">
                  {t.quote}
                </p>
                <div className="border-t border-white/10 pt-4">
                  <div className="text-stone-100 font-light text-sm">{t.name}</div>
                  <div className="text-amber-600 text-xs font-light mt-0.5">{t.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div data-reveal>
            <p className="text-xs tracking-extra-wide text-amber-600 mb-6 font-light">THE SPACE</p>
            <h2 className="text-4xl md:text-5xl font-light mb-6">Located in the heart of Inglewood</h2>
            <p className="text-xl text-stone-400 font-light mb-8 leading-relaxed">
              WePlay Studios sits at the intersection of culture and commerce, minutes from SoFi Stadium and
              the Forum. This is where the West Coast music scene comes alive.
            </p>
            <p className="text-stone-400 font-light mb-8 leading-relaxed">
              Our 15,000 sq ft facility features three recording studios, a conference center,
              an executive lounge, and collaborative workspaces designed for creativity.
            </p>
            <button className="border border-white/20 px-12 py-4 text-sm font-light tracking-wide hover:border-amber-600 hover:text-amber-600 transition-colors rounded-full">
              Tour the Space
            </button>
          </div>
          <div
            className="aspect-[4/3] overflow-hidden rounded-2xl border border-white/[0.08]"
            data-reveal
            style={{ transitionDelay: '0.15s' }}
          >
            <img
              src="/images/weplay-exterior.png"
              alt="WePlay Studios Exterior"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-32 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20" data-reveal>
            <h2 className="text-4xl md:text-5xl font-light mb-6">Leadership & Advisors</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-16">
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
            ].map((person, i) => (
              <div
                key={i}
                className="text-center"
                data-reveal
                style={{ transitionDelay: `${i * 0.15}s` }}
              >
                <div className="aspect-square mb-6 overflow-hidden rounded-2xl border border-white/[0.08]">
                  <img
                    src={person.img}
                    alt={person.name}
                    className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <h3 className="text-xl font-light mb-2">{person.name}</h3>
                <div className="text-amber-600 text-sm font-light mb-1">{person.role}</div>
                <p className="text-stone-400 text-sm font-light">{person.org}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist CTA */}
      <section className="py-32 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center" data-reveal>
          <h2 className="font-serif text-5xl md:text-6xl font-light mb-6">Join the Waitlist</h2>
          <p className="text-xl text-stone-400 font-light mb-12">
            Be the first to know when new membership spots open
          </p>
          <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 bg-white/[0.04] border border-white/10 px-6 py-4 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 rounded-full transition-colors"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 px-12 py-4 text-sm font-light tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed rounded-full"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xl font-light tracking-extra-wide">
            <span className="text-stone-100">IC</span>
            <span className="text-amber-600">WT</span>
          </div>
          <div className="text-stone-500 text-sm font-light text-center">
            <div>Inglewood, California</div>
            <div>© 2025 In Culture We Trust. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
