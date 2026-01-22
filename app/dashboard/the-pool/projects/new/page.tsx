'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Plus, X, DollarSign, Calendar, MapPin, Video, Target } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Milestone {
  title: string;
  description: string;
  date: string;
}

const categories = [
  'Album',
  'Single',
  'EP',
  'Music Video',
  'Tour',
  'Merchandise',
  'Documentary',
  'Podcast',
  'Live Event',
  'Other',
];

export default function CreateProjectPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    tagline: '',
    description: '',
    category: 'Album',
    funding_goal: '',
    expected_completion: '',
    location: '',
    video_url: '',
  });

  const [milestones, setMilestones] = useState<Milestone[]>([
    { title: '', description: '', date: '' },
  ]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMilestoneChange = (index: number, field: keyof Milestone, value: string) => {
    setMilestones(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addMilestone = () => {
    if (milestones.length < 10) {
      setMilestones(prev => [...prev, { title: '', description: '', date: '' }]);
    }
  };

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateStep1 = () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a project title');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a project description');
      return false;
    }
    if (!formData.funding_goal || parseFloat(formData.funding_goal) <= 0) {
      toast.error('Please enter a valid funding goal');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep1()) return;

    setIsSubmitting(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      toast.error('Configuration error');
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error('Please log in to create a project');
      router.push('/auth/login');
      return;
    }

    // Filter out empty milestones
    const validMilestones = milestones.filter(m => m.title.trim());

    const projectData = {
      title: formData.title.trim(),
      tagline: formData.tagline.trim() || null,
      description: formData.description.trim(),
      category: formData.category,
      funding_goal: parseFloat(formData.funding_goal),
      funding_raised: 0,
      expected_completion: formData.expected_completion || null,
      location: formData.location.trim() || null,
      video_url: formData.video_url.trim() || null,
      creator_id: user.id,
      status: 'pending', // Projects start as pending for review
      milestones: validMilestones.length > 0 ? validMilestones : null,
    };

    const { data, error } = await supabase
      .from('pool_projects')
      .insert([projectData])
      .select()
      .single();

    if (error) {
      console.error('Project creation error:', error);
      toast.error(`Failed to create project: ${error.message || error.code || 'Unknown error'}`);
    } else if (data) {
      toast.success('Project submitted successfully! It will be reviewed shortly.');
      router.push(`/dashboard/the-pool/projects/${data.id}`);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/dashboard/the-pool">
        <button className="flex items-center gap-2 text-amber-600 hover:underline mb-8 font-light">
          <ArrowLeft className="w-4 h-4" />
          Back to The Pool
        </button>
      </Link>

      <div className="mb-10">
        <h1 className="text-4xl font-light mb-2">Start a Project</h1>
        <p className="text-stone-400 font-light">
          Launch your creative vision and get funding from THE CLUB community
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-12">
        <button
          onClick={() => setCurrentStep(1)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-light border transition-colors ${
            currentStep === 1
              ? 'border-amber-600 text-amber-600 bg-amber-600/10'
              : 'border-stone-700 text-stone-400'
          }`}
        >
          <span className="w-6 h-6 border border-current rounded-full flex items-center justify-center text-xs">
            1
          </span>
          Basics
        </button>
        <div className="h-px w-8 bg-stone-800" />
        <button
          onClick={() => validateStep1() && setCurrentStep(2)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-light border transition-colors ${
            currentStep === 2
              ? 'border-amber-600 text-amber-600 bg-amber-600/10'
              : 'border-stone-700 text-stone-400'
          }`}
        >
          <span className="w-6 h-6 border border-current rounded-full flex items-center justify-center text-xs">
            2
          </span>
          Details
        </button>
        <div className="h-px w-8 bg-stone-800" />
        <button
          onClick={() => validateStep1() && setCurrentStep(3)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-light border transition-colors ${
            currentStep === 3
              ? 'border-amber-600 text-amber-600 bg-amber-600/10'
              : 'border-stone-700 text-stone-400'
          }`}
        >
          <span className="w-6 h-6 border border-current rounded-full flex items-center justify-center text-xs">
            3
          </span>
          Milestones
        </button>
      </div>

      {/* Step 1: Basics */}
      {currentStep === 1 && (
        <div className="space-y-8">
          <div className="border border-stone-800 p-8">
            <h2 className="text-xl font-light mb-6 flex items-center gap-3">
              <Target className="w-5 h-5 text-amber-600" />
              Project Basics
            </h2>

            <div className="space-y-6">
              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block">
                  Project Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Debut Album: Midnight Sessions"
                  className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
                />
              </div>

              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block">
                  Tagline
                </label>
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleInputChange}
                  placeholder="A short, catchy description (optional)"
                  maxLength={100}
                  className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
                />
                <p className="text-xs text-stone-500 mt-1">{formData.tagline.length}/100</p>
              </div>

              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full bg-stone-950 border border-stone-700 px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-600"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell potential investors about your project. What is it? Why should they invest? What makes it special?"
                  rows={6}
                  className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Funding Goal *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-stone-400">$</span>
                  <input
                    type="number"
                    name="funding_goal"
                    value={formData.funding_goal}
                    onChange={handleInputChange}
                    placeholder="50,000"
                    min="1000"
                    className="w-full bg-transparent border border-stone-700 pl-8 pr-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
                  />
                </div>
                <p className="text-xs text-stone-500 mt-1">Minimum $1,000</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => validateStep1() && setCurrentStep(2)}
              className="bg-amber-600 text-stone-950 px-8 py-3 text-sm font-light hover:bg-amber-700 transition-colors"
            >
              Continue to Details
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {currentStep === 2 && (
        <div className="space-y-8">
          <div className="border border-stone-800 p-8">
            <h2 className="text-xl font-light mb-6">Additional Details</h2>
            <p className="text-stone-400 font-light text-sm mb-8">
              These fields are optional but help investors understand your project better.
            </p>

            <div className="space-y-6">
              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Expected Completion Date
                </label>
                <input
                  type="date"
                  name="expected_completion"
                  value={formData.expected_completion}
                  onChange={handleInputChange}
                  className="w-full bg-stone-950 border border-stone-700 px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Los Angeles, CA"
                  className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
                />
              </div>

              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Video URL
                </label>
                <input
                  type="url"
                  name="video_url"
                  value={formData.video_url}
                  onChange={handleInputChange}
                  placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                  className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
                />
                <p className="text-xs text-stone-500 mt-1">
                  A pitch video can significantly increase investment interest
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="border border-stone-700 px-8 py-3 text-sm font-light hover:border-stone-600 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="bg-amber-600 text-stone-950 px-8 py-3 text-sm font-light hover:bg-amber-700 transition-colors"
            >
              Continue to Milestones
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Milestones */}
      {currentStep === 3 && (
        <div className="space-y-8">
          <div className="border border-stone-800 p-8">
            <h2 className="text-xl font-light mb-2">Project Milestones</h2>
            <p className="text-stone-400 font-light text-sm mb-8">
              Break your project into milestones to show investors how you'll use their funding.
              This is optional but highly recommended.
            </p>

            <div className="space-y-6">
              {milestones.map((milestone, index) => (
                <div key={index} className="border border-stone-800 p-6 relative">
                  {milestones.length > 1 && (
                    <button
                      onClick={() => removeMilestone(index)}
                      className="absolute top-4 right-4 text-stone-500 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 border border-amber-600 rounded-full flex items-center justify-center text-amber-600 text-sm font-light">
                      {index + 1}
                    </div>
                    <span className="text-sm text-stone-400 font-light">Milestone {index + 1}</span>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      value={milestone.title}
                      onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                      placeholder="Milestone title (e.g., Pre-production complete)"
                      className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
                    />
                    <textarea
                      value={milestone.description}
                      onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                      placeholder="Brief description of what this milestone includes..."
                      rows={2}
                      className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors resize-none"
                    />
                    <input
                      type="date"
                      value={milestone.date}
                      onChange={(e) => handleMilestoneChange(index, 'date', e.target.value)}
                      className="w-full bg-stone-950 border border-stone-700 px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>
              ))}

              {milestones.length < 10 && (
                <button
                  onClick={addMilestone}
                  className="w-full border border-dashed border-stone-700 py-4 text-sm font-light text-stone-400 hover:border-amber-600 hover:text-amber-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Milestone
                </button>
              )}
            </div>
          </div>

          {/* Preview Summary */}
          <div className="border border-amber-600/30 bg-amber-600/5 p-8">
            <h3 className="text-lg font-light mb-4">Project Summary</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-stone-400">Title:</span>{' '}
                <span className="font-light">{formData.title || '—'}</span>
              </div>
              <div>
                <span className="text-stone-400">Category:</span>{' '}
                <span className="font-light">{formData.category}</span>
              </div>
              <div>
                <span className="text-stone-400">Funding Goal:</span>{' '}
                <span className="font-light">
                  {formData.funding_goal ? `$${parseFloat(formData.funding_goal).toLocaleString()}` : '—'}
                </span>
              </div>
              <div>
                <span className="text-stone-400">Milestones:</span>{' '}
                <span className="font-light">{milestones.filter(m => m.title).length}</span>
              </div>
            </div>
          </div>

          <div className="border border-stone-800 p-6">
            <p className="text-xs text-stone-500 font-light">
              By submitting this project, you agree to THE CLUB's project guidelines and investment terms.
              Your project will be reviewed before being published to the community. Projects typically
              go live within 24-48 hours of submission.
            </p>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="border border-stone-700 px-8 py-3 text-sm font-light hover:border-stone-600 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-amber-600 text-stone-950 px-12 py-3 text-sm font-light hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Project'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
