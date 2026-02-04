'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Clock, Play, X, Check, TrendingUp, Share2, FileText, Download, ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Project {
  id: string;
  title: string;
  description: string;
  tagline?: string;
  category: string;
  funding_goal: number;
  funding_raised: number;
  status: string;
  creator_id: string;
  milestones?: Array<{ title: string; description: string; date: string; completed: boolean }>;
  equity_distribution?: any;
  video_url?: string;
  expected_completion?: string;
  location?: string;
  created_at: string;
}

interface Investment {
  id: string;
  user_id: string;
  amount: number;
  contribution_type: string;
  contribution_details?: string;
  equity_percentage: number;
  status: string;
  created_at: string;
  signature_name?: string;
  signature_agreed?: boolean;
  signature_timestamp?: string;
}

interface ProjectEarnings {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  distributed_amount: number;
  remaining_amount: number;
  last_updated: string;
}

interface ContributorEarnings {
  user_id: string;
  total_invested: number;
  equity_percentage: number;
  total_earned: number;
  pending_payout: number;
  total_payouts: number;
}

interface Creator {
  id: string;
  name: string;
  role?: string;
  tier: string;
  bio?: string;
}

const contributionTypes = [
  { value: 'cash', label: 'Cash Investment', description: 'Direct financial contribution' },
  { value: 'time', label: 'Time & Expertise', description: 'Production, mixing, or other skills' },
  { value: 'equipment', label: 'Equipment', description: 'Studio gear, instruments, etc.' },
  { value: 'services', label: 'Services', description: 'Marketing, legal, distribution, etc.' },
];

const INVESTMENT_TERMS = `IN CULTURE WE TRUST (ICWT) INVESTMENT AGREEMENT

TERMS AND CONDITIONS

1. PARTIES
This Investment Agreement ("Agreement") is entered into between In Culture We Trust ("ICWT" or "Company") and the undersigned investor ("Investor") regarding participation in the specified project ("Project") within The Pool investment platform.

2. INVESTMENT STRUCTURE
2.1. The Investor agrees to contribute the specified amount or resources to the Project as indicated in this investment submission.
2.2. Equity percentages are calculated based on the proportion of the Investor's contribution relative to the total funding goal.
2.3. Final equity allocations are subject to adjustment based on total contributions received and will be confirmed upon project completion.

3. INVESTOR ACKNOWLEDGMENTS
The Investor acknowledges and agrees that:
3.1. All investments in creative projects carry inherent risk, including the potential for total loss of investment.
3.2. Returns on investment are not guaranteed and depend on the commercial success of the Project.
3.3. The Project timeline may be subject to delays beyond the initially stated completion date.
3.4. ICWT acts as a facilitator and is not responsible for the success or failure of individual projects.

4. PROJECT CREATOR OBLIGATIONS
4.1. The Project Creator is responsible for executing the Project as described and providing regular updates to Investors.
4.2. The Project Creator agrees to distribute any profits according to the equity structure established through The Pool.
4.3. The Project Creator shall maintain accurate financial records related to the Project.

5. PROFIT DISTRIBUTION
5.1. Net profits from the Project shall be distributed to Investors in proportion to their equity stake.
5.2. Distribution timing and frequency will be determined by the Project Creator and communicated to Investors.
5.3. ICWT may retain a platform fee as disclosed in the Project listing.

6. NON-CASH CONTRIBUTIONS
6.1. Non-cash contributions (time, equipment, services) will be valued in good faith between the Investor and Project Creator.
6.2. Equity for non-cash contributions is subject to negotiation and final approval by the Project Creator.

7. CONFIDENTIALITY
7.1. The Investor agrees to maintain confidentiality regarding any proprietary project information shared during the investment process.

8. DISPUTE RESOLUTION
8.1. Any disputes arising from this Agreement shall first be addressed through mediation facilitated by ICWT.
8.2. If mediation fails, disputes shall be resolved through binding arbitration in accordance with applicable laws.

9. GOVERNING LAW
This Agreement shall be governed by the laws of the State of California, United States.

10. ENTIRE AGREEMENT
This Agreement, together with any Project-specific terms, constitutes the entire agreement between the parties regarding the investment described herein.

By typing your signature below, you acknowledge that you have read, understand, and agree to be bound by these Terms and Conditions.

Version 1.0 - Effective Date: January 2026`;

const TERMS_VERSION = '1.0';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [myInvestment, setMyInvestment] = useState<Investment | null>(null);
  const [projectEarnings, setProjectEarnings] = useState<ProjectEarnings | null>(null);
  const [contributorEarnings, setContributorEarnings] = useState<ContributorEarnings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Investment form state
  const [contributionType, setContributionType] = useState('cash');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [contributionDetails, setContributionDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // E-sign flow state
  const [investmentStep, setInvestmentStep] = useState(1); // 1: contribution details, 2: review & sign
  const [signatureName, setSignatureName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [hasScrolledTerms, setHasScrolledTerms] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) return;

      const supabase = createClient(supabaseUrl, supabaseKey);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setCurrentUserId(user.id);
      }

      // Fetch project
      const { data: projectData } = await supabase
        .from('pool_projects')
        .select('*')
        .eq('id', params.id)
        .maybeSingle();

      if (!projectData) {
        toast.error('Project not found');
        router.push('/dashboard/the-pool');
        return;
      }

      setProject(projectData);

      // Fetch creator
      const { data: creatorData } = await supabase
        .from('users')
        .select('id, name, role, tier, bio')
        .eq('id', projectData.creator_id)
        .maybeSingle();

      if (creatorData) {
        setCreator(creatorData);
      }

      // Fetch investments
      const { data: investmentsData } = await supabase
        .from('pool_investments')
        .select('*')
        .eq('project_id', params.id)
        .order('created_at', { ascending: false });

      setInvestments(investmentsData || []);

      // Check if current user has invested
      if (user) {
        const userInvestment = investmentsData?.find(inv => inv.user_id === user.id);
        if (userInvestment) {
          setMyInvestment(userInvestment);
        }
      }

      // Fetch project earnings (mock data for now)
      const mockEarnings: ProjectEarnings = {
        total_revenue: project?.funding_raised ? project.funding_raised * 1.5 : 0, // Mock: 150% of funding raised
        total_expenses: project?.funding_raised ? project.funding_raised * 0.3 : 0, // Mock: 30% expenses
        net_profit: project?.funding_raised ? project.funding_raised * 1.2 : 0, // Mock: 120% net profit
        distributed_amount: project?.funding_raised ? project.funding_raised * 0.8 : 0, // Mock: 80% distributed
        remaining_amount: project?.funding_raised ? project.funding_raised * 0.4 : 0, // Mock: 40% remaining
        last_updated: new Date().toISOString(),
      };
      setProjectEarnings(mockEarnings);

      // Calculate current user's earnings if they're an investor
      if (user && myInvestment) {
        const userEarnings: ContributorEarnings = {
          user_id: user.id,
          total_invested: myInvestment.amount,
          equity_percentage: myInvestment.equity_percentage,
          total_earned: (mockEarnings.distributed_amount * myInvestment.equity_percentage) / 100,
          pending_payout: (mockEarnings.remaining_amount * myInvestment.equity_percentage) / 100,
          total_payouts: (mockEarnings.distributed_amount * myInvestment.equity_percentage) / 100,
        };
        setContributorEarnings(userEarnings);
      }

      setIsLoading(false);
    };

    fetchProject();
  }, [params.id, router]);

  const calculateEquityForAmount = (amount: number) => {
    if (!project) return 0;
    // Simple equity calculation: (investment / goal) * available equity (let's say 49% available)
    const availableEquity = 49;
    return Math.min((amount / project.funding_goal) * availableEquity, availableEquity);
  };

  const handleInvest = async () => {
    if (!currentUserId || !project) return;

    // Validate signature
    if (!signatureName.trim()) {
      toast.error('Please type your signature');
      return;
    }

    if (!agreedToTerms) {
      toast.error('Please agree to the investment terms');
      return;
    }

    const amount = parseFloat(investmentAmount);
    if (contributionType === 'cash' && (isNaN(amount) || amount <= 0)) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      toast.error('Configuration error');
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const investmentData = {
      project_id: project.id,
      user_id: currentUserId,
      amount: contributionType === 'cash' ? amount : 0,
      contribution_type: contributionType,
      contribution_details: contributionDetails || null,
      equity_percentage: contributionType === 'cash' ? calculateEquityForAmount(amount) : 0,
      status: 'pending',
      signature_name: signatureName.trim(),
      signature_agreed: true,
      signature_timestamp: new Date().toISOString(),
      terms_version: TERMS_VERSION,
    };

    const { data, error } = await supabase
      .from('pool_investments')
      .insert([investmentData])
      .select()
      .single();

    if (error) {
      toast.error('Failed to submit investment');
    } else if (data) {
      toast.success('Investment submitted! The project creator will review your contribution.');
      setMyInvestment(data);
      setInvestments(prev => [data, ...prev]);
      setShowInvestModal(false);
      resetForm();
    }

    setIsSubmitting(false);
  };

  const resetForm = () => {
    setContributionType('cash');
    setInvestmentAmount('');
    setContributionDetails('');
    setInvestmentStep(1);
    setSignatureName('');
    setAgreedToTerms(false);
    setHasScrolledTerms(false);
  };

  const handleTermsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const scrolledToBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (scrolledToBottom) {
      setHasScrolledTerms(true);
    }
  };

  const downloadTermsPDF = () => {
    // Create a simple text blob for download (in production, this would be a proper PDF)
    const blob = new Blob([INVESTMENT_TERMS], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ICWT_Investment_Terms.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl">
        <div className="h-96 bg-stone-900 animate-pulse border border-stone-800" />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const percentFunded = Math.min((project.funding_raised / project.funding_goal) * 100, 100);
  const investorCount = investments.length;

  return (
    <div className="max-w-4xl">
      <Link href="/dashboard/the-pool/projects">
        <button className="flex items-center gap-2 text-amber-600 hover:underline mb-8 font-light">
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs bg-amber-600/20 text-amber-600 px-3 py-1 font-light uppercase tracking-wide">
            {project.category}
          </span>
          <span className={`text-xs px-3 py-1 font-light uppercase tracking-wide ${
            project.status === 'active'
              ? 'bg-green-600/20 text-green-500'
              : project.status === 'completed'
              ? 'bg-blue-600/20 text-blue-500'
              : 'bg-stone-600/20 text-stone-400'
          }`}>
            {project.status}
          </span>
        </div>
        <h1 className="text-4xl font-light mb-3">{project.title}</h1>
        {project.tagline && (
          <p className="text-xl text-stone-300 font-light">{project.tagline}</p>
        )}
      </div>

      {/* Video Embed */}
      {project.video_url && (
        <div className="border border-stone-800 aspect-video mb-8 overflow-hidden bg-stone-900">
          {(() => {
            const url = project.video_url;
            // YouTube embed
            const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            if (youtubeMatch) {
              return (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Project Video"
                />
              );
            }
            // Vimeo embed
            const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
            if (vimeoMatch) {
              return (
                <iframe
                  src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
                  className="w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title="Project Video"
                />
              );
            }
            // Loom embed
            const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
            if (loomMatch) {
              return (
                <iframe
                  src={`https://www.loom.com/embed/${loomMatch[1]}`}
                  className="w-full h-full"
                  allowFullScreen
                  title="Project Video"
                />
              );
            }
            // Default: show link with play button fallback
            return (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-full flex flex-col items-center justify-center gap-4 hover:bg-stone-800/50 transition-colors"
              >
                <div className="w-16 h-16 border-2 border-amber-600 rounded-full flex items-center justify-center text-amber-600">
                  <Play className="w-8 h-8 ml-1" />
                </div>
                <span className="text-amber-600 text-sm font-light">Watch Video</span>
              </a>
            );
          })()}
        </div>
      )}

      {/* Funding Progress */}
      <div className="border border-stone-800 p-8 mb-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="text-xs text-stone-400 font-light tracking-wide mb-1">RAISED</div>
            <div className="text-3xl font-light text-amber-600">
              ${project.funding_raised.toLocaleString()}
            </div>
            <div className="text-sm text-stone-400 font-light">
              of ${project.funding_goal.toLocaleString()} goal
            </div>
          </div>
          <div>
            <div className="text-xs text-stone-400 font-light tracking-wide mb-1">INVESTORS</div>
            <div className="text-3xl font-light">{investorCount}</div>
            <div className="text-sm text-stone-400 font-light">contributors</div>
          </div>
          <div>
            <div className="text-xs text-stone-400 font-light tracking-wide mb-1">FUNDED</div>
            <div className="text-3xl font-light">{Math.round(percentFunded)}%</div>
            <div className="text-sm text-stone-400 font-light">complete</div>
          </div>
        </div>

        <div className="w-full bg-stone-900 h-3 mb-6">
          <div
            className="bg-amber-600 h-full transition-all"
            style={{ width: `${percentFunded}%` }}
          />
        </div>

        {/* Project Earnings Overview (for creator) */}
        {projectEarnings && currentUserId === project.creator_id && project.status !== 'pending' && (
          <div className="border border-stone-800 p-8 mb-8">
            <h3 className="text-xl font-light mb-6">Project Financial Overview</h3>
            <div className="grid md:grid-cols-4 gap-6 mb-6">
              <div>
                <div className="text-xs text-stone-400 font-light tracking-wide mb-1">TOTAL REVENUE</div>
                <div className="text-xl font-light text-green-500">
                  ${projectEarnings.total_revenue.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-400 font-light tracking-wide mb-1">TOTAL EXPENSES</div>
                <div className="text-xl font-light text-red-500">
                  ${projectEarnings.total_expenses.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-400 font-light tracking-wide mb-1">NET PROFIT</div>
                <div className="text-xl font-light">
                  ${projectEarnings.net_profit.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-400 font-light tracking-wide mb-1">REMAINING</div>
                <div className="text-xl font-light text-amber-600">
                  ${projectEarnings.remaining_amount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Earnings Section (for investors) */}
        {contributorEarnings && project.status === 'completed' && (
          <div className="border border-stone-800 p-8 mb-8">
            <h3 className="text-xl font-light mb-6 text-amber-600">Your Investment Earnings</h3>
            <div className="grid md:grid-cols-4 gap-6 mb-6">
              <div>
                <div className="text-xs text-stone-400 font-light tracking-wide mb-1">TOTAL INVESTED</div>
                <div className="text-xl font-light">
                  ${contributorEarnings.total_invested.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-400 font-light tracking-wide mb-1">EQUITY SHARE</div>
                <div className="text-xl font-light text-amber-600">
                  {contributorEarnings.equity_percentage.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-400 font-light tracking-wide mb-1">TOTAL EARNED</div>
                <div className="text-xl font-light text-green-500">
                  ${contributorEarnings.total_earned.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-400 font-light tracking-wide mb-1">PENDING PAYOUT</div>
                <div className="text-xl font-light text-blue-500">
                  ${contributorEarnings.pending_payout.toLocaleString()}
                </div>
              </div>
            </div>
            
            {contributorEarnings.pending_payout > 0 && (
              <div className="border border-stone-700 bg-stone-900/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-light text-stone-300">Available for withdrawal</div>
                    <div className="text-xs text-stone-500">Payment processing will be available soon</div>
                  </div>
                  <button 
                    disabled
                    className="px-4 py-2 bg-stone-800 text-stone-500 font-light text-sm border border-stone-700 cursor-not-allowed"
                  >
                    Request Payout (Coming Soon)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Investment CTA */}
        {project.status === 'active' && (
          <div>
            {currentUserId === project.creator_id ? (
              <div className="border border-stone-700 bg-stone-900/50 p-6">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-amber-600" />
                  <span className="font-light text-stone-300">This is your project</span>
                </div>
                <p className="text-sm text-stone-500 font-light mt-2">
                  Share this page with potential investors to get funding for your project.
                </p>
              </div>
            ) : myInvestment ? (
              <div className="border border-green-600/30 bg-green-600/5 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="font-light text-green-500">You're an investor in this project</span>
                </div>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-stone-400 font-light">Your Contribution</div>
                    <div className="font-light">
                      {myInvestment.contribution_type === 'cash'
                        ? `$${myInvestment.amount.toLocaleString()}`
                        : myInvestment.contribution_type}
                    </div>
                  </div>
                  <div>
                    <div className="text-stone-400 font-light">Equity Share</div>
                    <div className="font-light">{myInvestment.equity_percentage.toFixed(2)}%</div>
                  </div>
                  <div>
                    <div className="text-stone-400 font-light">Status</div>
                    <div className={`font-light capitalize ${
                      myInvestment.status === 'active' ? 'text-green-500' : 'text-amber-500'
                    }`}>
                      {myInvestment.status}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowInvestModal(true)}
                className="w-full bg-amber-600 text-stone-950 py-4 text-sm font-light tracking-wide hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
              >
                <DollarSign className="w-5 h-5" />
                Invest in This Project
              </button>
            )}
          </div>
        )}
      </div>

      {/* Project Details Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {project.expected_completion && (
          <div className="border border-stone-800 p-6 flex items-center gap-4">
            <Calendar className="w-6 h-6 text-amber-600" />
            <div>
              <div className="text-sm text-stone-400 font-light">Expected Completion</div>
              <div className="font-light">
                {new Date(project.expected_completion).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>
        )}
        {project.location && (
          <div className="border border-stone-800 p-6 flex items-center gap-4">
            <MapPin className="w-6 h-6 text-amber-600" />
            <div>
              <div className="text-sm text-stone-400 font-light">Location</div>
              <div className="font-light">{project.location}</div>
            </div>
          </div>
        )}
      </div>

      {/* Creator Info */}
      {creator && (
        <div className="border border-stone-800 p-8 mb-8">
          <h3 className="text-lg font-light mb-4">Project Creator</h3>
          <Link href={`/dashboard/directory/${creator.id}`}>
            <div className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center">
                <span className="text-stone-950 font-light text-lg">
                  {creator.name?.charAt(0) || '?'}
                </span>
              </div>
              <div>
                <div className="font-light">{creator.name}</div>
                {creator.role && (
                  <div className="text-sm text-amber-600 font-light">{creator.role}</div>
                )}
              </div>
            </div>
          </Link>
          {creator.bio && (
            <p className="text-stone-400 font-light mt-4 text-sm leading-relaxed">{creator.bio}</p>
          )}
        </div>
      )}

      {/* Description */}
      <div className="border border-stone-800 p-8 mb-8">
        <h2 className="text-2xl font-light mb-4">About This Project</h2>
        <p className="text-stone-300 font-light leading-relaxed whitespace-pre-line">
          {project.description}
        </p>
      </div>

      {/* Milestones */}
      {project.milestones && project.milestones.length > 0 && (
        <div className="border border-stone-800 p-8 mb-8">
          <h2 className="text-2xl font-light mb-6">Project Milestones</h2>
          <div className="space-y-4">
            {project.milestones.map((milestone, idx) => (
              <div key={idx} className="border border-stone-800 p-6 flex items-start gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  milestone.completed
                    ? 'bg-green-600 text-stone-950'
                    : 'border border-stone-700 text-stone-500'
                }`}>
                  {milestone.completed ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-light">{idx + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-light">{milestone.title}</h4>
                    {milestone.date && (
                      <span className="text-xs text-stone-500 font-light">{milestone.date}</span>
                    )}
                  </div>
                  <p className="text-sm text-stone-400 font-light">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Investors List */}
      {investments.length > 0 && (
        <div className="border border-stone-800 p-8">
          <h2 className="text-2xl font-light mb-6">Contributors ({investments.length})</h2>
          <div className="space-y-3">
            {investments.slice(0, 10).map((inv, idx) => (
              <div key={inv.id} className="flex items-center justify-between py-3 border-b border-stone-800 last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center">
                    <span className="text-stone-950 text-xs font-light">{idx + 1}</span>
                  </div>
                  <div>
                    <div className="text-sm font-light capitalize">{inv.contribution_type}</div>
                    {inv.contribution_details && (
                      <div className="text-xs text-stone-500 font-light">{inv.contribution_details}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {inv.amount > 0 && (
                    <div className="font-light">${inv.amount.toLocaleString()}</div>
                  )}
                  <div className="text-xs text-stone-400 font-light">
                    {inv.equity_percentage > 0 ? `${inv.equity_percentage.toFixed(2)}% equity` : 'TBD'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Investment Modal - Two Step Flow */}
      {showInvestModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-950 border border-stone-800 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-light">
                  {investmentStep === 1 ? 'Contribute to Project' : 'Review & Sign Agreement'}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-8 h-1 ${investmentStep >= 1 ? 'bg-amber-600' : 'bg-stone-700'}`} />
                  <div className={`w-8 h-1 ${investmentStep >= 2 ? 'bg-amber-600' : 'bg-stone-700'}`} />
                  <span className="text-xs text-stone-500 ml-2">Step {investmentStep} of 2</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowInvestModal(false);
                  resetForm();
                }}
                className="text-stone-400 hover:text-stone-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Step 1: Contribution Details */}
            {investmentStep === 1 && (
              <>
                <div className="mb-6">
                  <p className="text-stone-400 font-light text-sm">
                    Choose how you'd like to contribute to "{project.title}"
                  </p>
                </div>

                {/* Contribution Type */}
                <div className="mb-6">
                  <label className="text-sm text-stone-400 font-light mb-3 block">
                    Contribution Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {contributionTypes.map(type => (
                      <button
                        key={type.value}
                        onClick={() => setContributionType(type.value)}
                        className={`p-4 border text-left transition-colors ${
                          contributionType === type.value
                            ? 'border-amber-600 bg-amber-600/10'
                            : 'border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        <div className="font-light text-sm mb-1">{type.label}</div>
                        <div className="text-xs text-stone-500">{type.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount (for cash contributions) */}
                {contributionType === 'cash' && (
                  <div className="mb-6">
                    <label className="text-sm text-stone-400 font-light mb-2 block">
                      Investment Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-stone-400">$</span>
                      <input
                        type="number"
                        value={investmentAmount}
                        onChange={(e) => setInvestmentAmount(e.target.value)}
                        placeholder="5,000"
                        min="100"
                        className="w-full bg-transparent border border-stone-700 pl-8 pr-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
                      />
                    </div>
                    {investmentAmount && parseFloat(investmentAmount) > 0 && (
                      <div className="mt-3 p-4 border border-amber-600/30 bg-amber-600/5">
                        <div className="flex items-center gap-2 text-amber-600 text-sm font-light">
                          <TrendingUp className="w-4 h-4" />
                          <span>
                            Estimated equity: {calculateEquityForAmount(parseFloat(investmentAmount)).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      {[1000, 2500, 5000, 10000].map(amount => (
                        <button
                          key={amount}
                          onClick={() => setInvestmentAmount(amount.toString())}
                          className="flex-1 border border-stone-800 py-2 text-xs font-light hover:border-amber-600 hover:text-amber-600 transition-colors"
                        >
                          ${(amount / 1000).toFixed(0)}K
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contribution Details */}
                <div className="mb-8">
                  <label className="text-sm text-stone-400 font-light mb-2 block">
                    {contributionType === 'cash' ? 'Notes (optional)' : 'Describe Your Contribution'}
                  </label>
                  <textarea
                    value={contributionDetails}
                    onChange={(e) => setContributionDetails(e.target.value)}
                    placeholder={
                      contributionType === 'cash'
                        ? 'Any additional notes...'
                        : contributionType === 'time'
                        ? 'e.g., 40 hours of mixing and mastering...'
                        : contributionType === 'equipment'
                        ? 'e.g., Neumann U87 microphone, SSL compressor...'
                        : 'e.g., Social media marketing campaign, legal review...'
                    }
                    rows={3}
                    className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors resize-none"
                  />
                </div>

                <div className="border-t border-stone-800 pt-6">
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setShowInvestModal(false);
                        resetForm();
                      }}
                      className="flex-1 border border-stone-700 py-3 text-sm font-light hover:border-stone-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setInvestmentStep(2)}
                      disabled={contributionType === 'cash' && (!investmentAmount || parseFloat(investmentAmount) <= 0)}
                      className="flex-1 bg-amber-600 text-stone-950 py-3 text-sm font-light hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      Continue to Agreement
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Review Terms & Sign */}
            {investmentStep === 2 && (
              <>
                {/* Investment Summary */}
                <div className="border border-stone-800 p-4 mb-6 bg-stone-900/50">
                  <h4 className="text-sm text-stone-400 font-light mb-2">Your Contribution</h4>
                  <div className="flex items-center justify-between">
                    <span className="font-light capitalize">{contributionType}</span>
                    {contributionType === 'cash' && (
                      <span className="text-amber-600 font-light">
                        ${parseFloat(investmentAmount).toLocaleString()} ({calculateEquityForAmount(parseFloat(investmentAmount)).toFixed(2)}% equity)
                      </span>
                    )}
                  </div>
                  {contributionDetails && (
                    <p className="text-xs text-stone-500 mt-2">{contributionDetails}</p>
                  )}
                </div>

                {/* Terms Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-stone-400 font-light">Investment Agreement</span>
                    </div>
                    <button
                      onClick={downloadTermsPDF}
                      className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-500 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Download Terms
                    </button>
                  </div>
                  <div
                    onScroll={handleTermsScroll}
                    className="border border-stone-700 bg-stone-950 p-4 h-64 overflow-y-auto text-xs text-stone-400 font-light leading-relaxed whitespace-pre-wrap"
                  >
                    {INVESTMENT_TERMS}
                  </div>
                  {!hasScrolledTerms && (
                    <p className="text-xs text-amber-600/70 mt-2 text-center">
                      Please scroll through the entire agreement to continue
                    </p>
                  )}
                </div>

                {/* Signature Section */}
                <div className="mb-6">
                  <label className="text-sm text-stone-400 font-light mb-2 block">
                    Type Your Full Legal Name as Signature
                  </label>
                  <input
                    type="text"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    placeholder="Your Full Legal Name"
                    className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors font-serif text-lg italic"
                  />
                  {signatureName && (
                    <div className="mt-3 p-4 border border-stone-800 bg-stone-900/30">
                      <p className="text-xs text-stone-500 mb-1">Signature Preview:</p>
                      <p className="font-serif text-xl italic text-stone-100">{signatureName}</p>
                    </div>
                  )}
                </div>

                {/* Agreement Checkbox */}
                <div className="mb-8">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      disabled={!hasScrolledTerms}
                      className="mt-1 w-5 h-5 bg-transparent border border-stone-600 rounded-sm checked:bg-amber-600 checked:border-amber-600 focus:ring-amber-600 focus:ring-offset-stone-950 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className={`text-sm font-light ${hasScrolledTerms ? 'text-stone-300' : 'text-stone-500'}`}>
                      I have read and agree to the Investment Agreement terms and conditions. I understand that investments carry risk and returns are not guaranteed. I confirm that my typed signature above constitutes my legal electronic signature.
                    </span>
                  </label>
                </div>

                <div className="border-t border-stone-800 pt-6">
                  <p className="text-xs text-stone-500 font-light mb-4 text-center">
                    By clicking "Sign & Submit", you are electronically signing this agreement.
                    <br />
                    Timestamp: {new Date().toLocaleString()}
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setInvestmentStep(1)}
                      className="flex-1 border border-stone-700 py-3 text-sm font-light hover:border-stone-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                    <button
                      onClick={handleInvest}
                      disabled={isSubmitting || !signatureName.trim() || !agreedToTerms || !hasScrolledTerms}
                      className="flex-1 bg-amber-600 text-stone-950 py-3 text-sm font-light hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? 'Submitting...' : (
                        <>
                          <Check className="w-4 h-4" />
                          Sign & Submit Investment
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
