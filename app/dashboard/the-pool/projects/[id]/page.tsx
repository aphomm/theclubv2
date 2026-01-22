'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Clock, Play, X, Check, TrendingUp } from 'lucide-react';
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

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [myInvestment, setMyInvestment] = useState<Investment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Investment form state
  const [contributionType, setContributionType] = useState('cash');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [contributionDetails, setContributionDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      {/* Video Preview (Placeholder) */}
      {project.video_url && (
        <div className="border border-stone-800 aspect-video mb-8 flex items-center justify-center bg-stone-900">
          <button className="w-16 h-16 border-2 border-amber-600 rounded-full flex items-center justify-center text-amber-600 hover:bg-amber-600 hover:text-stone-950 transition-colors">
            <Play className="w-8 h-8 ml-1" />
          </button>
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

        {/* Investment CTA */}
        {project.status === 'active' && (
          <div>
            {myInvestment ? (
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
                className="w-full bg-amber-600 text-stone-950 py-4 text-sm font-light tracking-wide hover:bg-amber-700 transition-colors"
              >
                Contribute to This Project
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

      {/* Investment Modal */}
      {showInvestModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-950 border border-stone-800 p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light">Contribute to Project</h2>
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
              <p className="text-xs text-stone-500 font-light mb-6">
                By contributing, you agree to THE CLUB's investment terms. All contributions are subject
                to review by the project creator. Equity percentages are finalized upon project completion.
              </p>
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
                  onClick={handleInvest}
                  disabled={isSubmitting || (contributionType === 'cash' && (!investmentAmount || parseFloat(investmentAmount) <= 0))}
                  className="flex-1 bg-amber-600 text-stone-950 py-3 text-sm font-light hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Contribution'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
