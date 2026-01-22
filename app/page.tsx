'use client';

import { useState } from 'react';
import { MapPin, Users, Calendar, Briefcase, Network, Check, Play, Star } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const { error } = await supabase
      .from('waitlist')
      .insert([{ email }]);

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
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-stone-800 bg-stone-950/80 backdrop-blur-sm">
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
          <a href="/auth/signup">
            <button className="bg-amber-600 text-stone-950 px-8 py-3 text-sm font-light tracking-wide hover:bg-amber-700 transition-colors">
              Apply
            </button>
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-amber-600 text-amber-600 text-xs font-light tracking-extra-wide mb-12">
            <MapPin className="w-3 h-3" />
            INGLEWOOD, CALIFORNIA
          </div>
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-light mb-8 leading-tight">
            In CULTURE{' '}
            <span className="italic font-serif text-amber-600">We TRUST</span>
          </h1>
          <p className="text-xl text-stone-400 font-light max-w-3xl mx-auto mb-16 leading-relaxed">
          A private cultural membership built at the intersection of music, tech, film, fashion, sports, wellness, and aerospace. This isn't just another club – it's the front door into the 1500 or Nothin' × WePlay Studios cultural operating system, where the world's most influential creators and operators gather to build, connect, and own.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <a href="/auth/signup">
              <button className="bg-amber-600 text-stone-950 px-12 py-4 text-sm font-light tracking-wide hover:bg-amber-700 transition-colors">
                Apply for Membership
              </button>
            </a>
            <button className="border border-stone-700 text-stone-100 px-12 py-4 text-sm font-light tracking-wide hover:border-amber-600 hover:text-amber-600 transition-colors flex items-center gap-3">
              <Play className="w-4 h-4" />
              Watch Video
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 border-t border-stone-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="border border-stone-900 p-10 hover:border-amber-600 transition-colors group">
              <Network className="w-8 h-8 text-amber-600 mb-6" />
              <h3 className="text-xl font-light mb-4 tracking-wide">Elite Network</h3>
              <p className="text-stone-400 font-light leading-relaxed">
                Connect with Grammy winners, platinum producers, and label executives shaping the industry.
              </p>
            </div>
            <div className="border border-stone-900 p-10 hover:border-amber-600 transition-colors group">
              <Calendar className="w-8 h-8 text-amber-600 mb-6" />
              <h3 className="text-xl font-light mb-4 tracking-wide">Exclusive Events</h3>
              <p className="text-stone-400 font-light leading-relaxed">
                Private listening sessions, industry masterclasses, and invite-only networking experiences.
              </p>
            </div>
            <div className="border border-stone-900 p-10 hover:border-amber-600 transition-colors group">
              <Briefcase className="w-8 h-8 text-amber-600 mb-6" />
              <h3 className="text-xl font-light mb-4 tracking-wide">Studio Access</h3>
              <p className="text-stone-400 font-light leading-relaxed">
                World-class recording facilities at WePlay Studios with professional-grade equipment.
              </p>
            </div>
            <div className="border border-stone-900 p-10 hover:border-amber-600 transition-colors group">
              <Star className="w-8 h-8 text-amber-600 mb-6" />
              <h3 className="text-xl font-light mb-4 tracking-wide">Collaborative IP</h3>
              <p className="text-stone-400 font-light leading-relaxed">
                Pool resources on projects with transparent equity tracking and profit distribution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy & Stats */}
      <section id="about" className="py-32 px-6 border-t border-stone-900">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-light mb-8">Built for the culture, by the culture</h2>
          <p className="text-xl text-stone-400 font-light max-w-3xl mx-auto mb-20 leading-relaxed">
            We're more than a membership club. We're a movement of creators who believe in collective success,
            shared equity, and building generational wealth through collaboration.
          </p>
          <div className="grid md:grid-cols-3 gap-16">
            <div>
              <div className="text-6xl font-light text-amber-600 mb-4">XXX+</div>
              <div className="text-stone-400 font-light tracking-wide">Members</div>
            </div>
            <div>
              <div className="text-6xl font-light text-amber-600 mb-4">XXX+</div>
              <div className="text-stone-400 font-light tracking-wide">Events Annually</div>
            </div>
            <div>
              <div className="text-6xl font-light text-amber-600 mb-4">$XXXM+</div>
              <div className="text-stone-400 font-light tracking-wide">Deals Closed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Tiers */}
      <section id="membership" className="py-32 px-6 border-t border-stone-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-light mb-6">Choose Your Level</h2>
            <p className="text-xl text-stone-400 font-light">
              Three tiers designed for different stages of your creative journey
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Creator Tier */}
            <div className="border border-stone-900 p-10">
              <div className="mb-8">
                <h3 className="text-2xl font-light mb-2">Creator</h3>
                <div className="text-5xl font-light text-amber-600 mb-4">$500<span className="text-xl text-stone-400">/mo</span></div>
                <p className="text-stone-400 font-light">For emerging artists and producers</p>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-start gap-3 text-stone-300 font-light">
                  <Check className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  Basic access to networking events
                </li>
                <li className="flex items-start gap-3 text-stone-300 font-light">
                  <Check className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  Member directory access
                </li>
                <li className="flex items-start gap-3 text-stone-300 font-light">
                  <Check className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  Quarterly masterclasses
                </li>
                <li className="flex items-start gap-3 text-stone-300 font-light">
                  <Check className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  Resource library access
                </li>
              </ul>
              <a href="/auth/signup?tier=creator">
                <button className="w-full border border-stone-700 py-3 text-sm font-light tracking-wide hover:border-amber-600 hover:text-amber-600 transition-colors">
                  Apply Now
                </button>
              </a>
            </div>

            {/* Professional Tier */}
            <div className="border-2 border-amber-600 p-10 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-600 text-stone-950 px-6 py-1 text-xs tracking-extra-wide">
                MOST POPULAR
              </div>
              <div className="mb-8">
                <h3 className="text-2xl font-light mb-2">Professional</h3>
                <div className="text-5xl font-light text-amber-600 mb-4">$1,200<span className="text-xl text-stone-400">/mo</span></div>
                <p className="text-stone-400 font-light">For established professionals</p>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-start gap-3 text-stone-300 font-light">
                  <Check className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  Everything in Creator, plus
                </li>
                <li className="flex items-start gap-3 text-stone-300 font-light">
                  <Check className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  10 studio hours per month
                </li>
                <li className="flex items-start gap-3 text-stone-300 font-light">
                  <Check className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  VIP event access
                </li>
                <li className="flex items-start gap-3 text-stone-300 font-light">
                  <Check className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  Collaboration matching
                </li>
                <li className="flex items-start gap-3 text-stone-300 font-light">
                  <Check className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  Pool platform access
                </li>
              </ul>
              <a href="/auth/signup?tier=professional">
                <button className="w-full bg-amber-600 text-stone-950 py-3 text-sm font-light tracking-wide hover:bg-amber-700 transition-colors">
                  Apply Now
                </button>
              </a>
            </div>

            {/* Executive Tier */}
            <div className="border border-stone-900 p-10">
              <div className="mb-8">
                <h3 className="text-2xl font-light mb-2">Executive</h3>
                <div className="text-5xl font-light text-amber-600 mb-4">$2,500<span className="text-xl text-stone-400">/mo</span></div>
                <p className="text-stone-400 font-light">For industry executives</p>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-start gap-3 text-stone-300 font-light">
                  <Check className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  Everything in Professional, plus
                </li>
                <li className="flex items-start gap-3 text-stone-300 font-light">
                  <Check className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  Unlimited studio access
                </li>
                <li className="flex items-start gap-3 text-stone-300 font-light">
                  <Check className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  Executive lounge access
                </li>
                <li className="flex items-start gap-3 text-stone-300 font-light">
                  <Check className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  Priority Pool investments
                </li>
                <li className="flex items-start gap-3 text-stone-300 font-light">
                  <Check className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  1-on-1 advisory sessions
                </li>
              </ul>
              <a href="/auth/signup?tier=executive">
                <button className="w-full border border-stone-700 py-3 text-sm font-light tracking-wide hover:border-amber-600 hover:text-amber-600 transition-colors">
                  Apply Now
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* The Pool Feature */}
      <section className="py-32 px-6 border-t border-stone-900">
        <div className="max-w-5xl mx-auto border border-amber-600/30 p-16 bg-gradient-to-br from-amber-600/5 to-transparent">
          <div className="text-xs tracking-extra-wide text-amber-600 mb-6">INTRODUCING THE POOL</div>
          <h2 className="text-4xl md:text-5xl font-light mb-6">Build. Fund. Own. Together.</h2>
          <p className="text-xl text-stone-400 font-light max-w-2xl mb-10 leading-relaxed">
            A collaborative project platform where members pool resources to fund albums, tours, and ventures.
            Contribute cash, time, or equipment in exchange for transparent equity ownership and profit sharing.
          </p>
          <button className="border border-amber-600 text-amber-600 px-12 py-4 text-sm font-light tracking-wide hover:bg-amber-600 hover:text-stone-950 transition-colors">
            Learn More
          </button>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-6 border-t border-stone-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="border-l-2 border-amber-600 pl-8">
              <p className="text-xl italic text-stone-300 font-light mb-6 leading-relaxed">
                "This isn't just a club, it's a movement. The connections I've made here have transformed my career."
              </p>
              <div className="text-stone-100 font-light">Marcus Johnson</div>
              <div className="text-amber-600 text-sm font-light">Producer, 3x Grammy Winner</div>
            </div>
            <div className="border-l-2 border-amber-600 pl-8">
              <p className="text-xl italic text-stone-300 font-light mb-6 leading-relaxed">
                "The Pool helped me fund my album without losing creative control. Game changer."
              </p>
              <div className="text-stone-100 font-light">Aaliyah Davis</div>
              <div className="text-amber-600 text-sm font-light">Artist, R&B Singer-Songwriter</div>
            </div>
            <div className="border-l-2 border-amber-600 pl-8">
              <p className="text-xl italic text-stone-300 font-light mb-6 leading-relaxed">
                "Elite access to facilities and people you can't find anywhere else in LA."
              </p>
              <div className="text-stone-100 font-light">David Chen</div>
              <div className="text-amber-600 text-sm font-light">Label Executive, Atlantic Records</div>
            </div>
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="py-32 px-6 border-t border-stone-900">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-light mb-6">Located in the heart of Inglewood</h2>
            <p className="text-xl text-stone-400 font-light mb-8 leading-relaxed">
              WePlay Studios sits at the intersection of culture and commerce, minutes from SoFi Stadium and
              the Forum. This is where the West Coast music scene comes alive.
            </p>
            <p className="text-stone-400 font-light mb-8 leading-relaxed">
              Our 15,000 sq ft facility features three recording studios, a conference center,
              an executive lounge, and collaborative workspaces designed for creativity.
            </p>
            <button className="border border-stone-700 px-12 py-4 text-sm font-light tracking-wide hover:border-amber-600 hover:text-amber-600 transition-colors">
              Tour the Space
            </button>
          </div>
          <div className="bg-stone-900 aspect-[4/3] flex items-center justify-center border border-stone-800">
            <MapPin className="w-16 h-16 text-stone-700" />
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-32 px-6 border-t border-stone-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-light mb-6">Leadership & Advisors</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-12">
            {[
              { name: 'James Wilson', role: 'Founder & CEO', bio: '20+ years in music production' },
              { name: 'Sarah Martinez', role: 'Head of Operations', bio: 'Former Warner Music executive' },
              { name: 'Michael Brown', role: 'Creative Director', bio: 'Multi-platinum producer' },
              { name: 'Lisa Anderson', role: 'Community Lead', bio: 'Artist development specialist' }
            ].map((member, i) => (
              <div key={i} className="text-center">
                <div className="bg-stone-900 aspect-square mb-6 flex items-center justify-center border border-stone-800">
                  <Users className="w-16 h-16 text-stone-700" />
                </div>
                <h3 className="text-xl font-light mb-2">{member.name}</h3>
                <div className="text-amber-600 text-sm font-light mb-3">{member.role}</div>
                <p className="text-stone-400 text-sm font-light">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist CTA */}
      <section className="py-32 px-6 border-t border-stone-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-light mb-6">Join the Waitlist</h2>
          <p className="text-xl text-stone-400 font-light mb-12">
            Be the first to know when new membership spots open
          </p>
          <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 bg-transparent border border-stone-700 px-6 py-4 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-600 text-stone-950 px-12 py-4 text-sm font-light tracking-wide hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-900 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xl font-light tracking-extra-wide">
            <span className="text-stone-100">THE</span>{' '}
            <span className="text-amber-600">CLUB</span>
          </div>
          <div className="text-stone-500 text-sm font-light text-center">
            <div>Inglewood, California</div>
            <div>© 2025 The Club. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
