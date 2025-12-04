import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Briefcase, MapPin, Sparkles, TrendingUp, BookOpen } from 'lucide-react';
import Navbar from '../components/ui/Navbar';
import Footer from '../components/ui/Footer';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EnhancedProfileCard from '../components/dashboard/EnhancedProfileCard';
import SkillsPanel from '../components/dashboard/SkillsPanel';
import MCQVerificationModal from '../components/dashboard/MCQVerificationModal';
import { useResumeContext } from '../hooks/useResumeContext';
import { useAuth } from '../hooks/useAuth';

const USD_TO_INR_RATE = Number(import.meta.env?.VITE_USD_TO_INR_RATE) || 83;

const extractWatsonSummaryText = (watsonSummary) => {
  if (!watsonSummary) return '';

  if (typeof watsonSummary.executiveSummary === 'string') {
    return watsonSummary.executiveSummary;
  }

  const summaryBlock = watsonSummary.summary;
  if (!summaryBlock) {
    return '';
  }

  if (typeof summaryBlock === 'string') {
    return summaryBlock;
  }

  if (typeof summaryBlock.overallAssessment === 'string') {
    return summaryBlock.overallAssessment;
  }

  const concatenated = [
    summaryBlock.strengths?.join(', '),
    summaryBlock.areasToImprove?.join(', '),
    summaryBlock.careerAdvice
  ]
    .filter(Boolean)
    .join(' • ');

  return concatenated;
};

const formatInrValue = (usdValue) => {
  if (usdValue === undefined || usdValue === null || Number.isNaN(Number(usdValue))) {
    return '₹0';
  }

  const inrValue = Number(usdValue) * USD_TO_INR_RATE;

  if (inrValue >= 1e7) {
    return `₹${(inrValue / 1e7).toFixed(1)}Cr`;
  }

  if (inrValue >= 1e5) {
    return `₹${(inrValue / 1e5).toFixed(1)}L`;
  }

  return `₹${Math.round(inrValue).toLocaleString('en-IN')}`;
};

const normalizeImpactToInr = (entry) => {
  if (!entry) return '₹0';

  const absolute = entry.salaryBoost?.absoluteUSD;
  if (typeof absolute === 'number') {
    return formatInrValue(absolute);
  }
  if (absolute && typeof absolute === 'object') {
    const min = absolute.min ?? absolute.max;
    const max = absolute.max ?? absolute.min ?? min;
    if (min && max && min !== max) {
      return `${formatInrValue(min)} – ${formatInrValue(max)}`;
    }
    if (max) {
      return formatInrValue(max);
    }
  }

  if (typeof entry.impact === 'string') {
    return entry.impact.replace(/\$/g, '₹');
  }

  return '₹0';
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { parsedResume, resumeId, skillGaps, predictedRoles, matchedJobs, salaryBoost, resources, watsonSummary } = useResumeContext();
  const [profileSnapshot, setProfileSnapshot] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [mcqModalOpen, setMcqModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!parsedResume) {
      navigate('/upload');
    }
  }, [isAuthenticated, parsedResume, navigate]);

  const handleSkillVerify = (skill) => {
    const skillName = typeof skill === 'string' ? skill : skill?.skill || skill?.name;
    if (!skillName) {
      return;
    }
    setSelectedSkill(skillName);
    setMcqModalOpen(true);
  };

  const handleVerificationComplete = () => {
    setMcqModalOpen(false);
    setRefreshToken(Date.now());
  };

  const bestRole = useMemo(() => {
    if (Array.isArray(predictedRoles) && predictedRoles.length > 0) {
      return predictedRoles[0];
    }
    return predictedRoles?.primaryRole || null;
  }, [predictedRoles]);

  const verifiedSkillsData = useMemo(() => {
    const snapshotVerifications = profileSnapshot?.skillVerifications || profileSnapshot?.customSkills;

    if (snapshotVerifications?.length) {
      return snapshotVerifications
        .filter((entry) => entry?.verified)
        .map((entry) => ({
          skill: entry.skill || entry.name,
          proficiency: entry.score ?? entry.level ?? 0,
          verified: true,
          badge: entry.badge,
          score: entry.score ?? entry.level ?? 0
        }));
    }

    const fallbackSkills = (skillGaps?.skillsHave || []).filter((entry) => entry?.verified);
    return fallbackSkills.map((entry) => ({
      skill: entry.skill || entry.name,
      proficiency: entry.score ?? entry.level ?? 0,
      verified: true,
      badge: entry.badge,
      score: entry.score ?? entry.level ?? 0
    }));
  }, [profileSnapshot, skillGaps]);

  const skillsHaveData = verifiedSkillsData;

  const verifiedCount = verifiedSkillsData.length;

  const totalSkills = skillGaps?.skillsHave?.length || 0;
  const skillMatch = skillGaps?.skillGapSummary?.coreSkillMatch || 0;
  const topSalaryBoost = normalizeImpactToInr(salaryBoost?.[0]);
  const resourcePreview = (resources || []).slice(0, 2);
  const resumeSummary =
    parsedResume?.summary ||
    parsedResume?.professional_summary ||
    parsedResume?.bio ||
    extractWatsonSummaryText(watsonSummary);

  if (!parsedResume) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--rg-bg)] text-[var(--rg-text-primary)]">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 space-y-10">
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"
          >
            <Card gradient className="relative overflow-hidden">
              <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_rgba(0,0,0,0))]" />
              <div className="relative z-10 flex flex-col gap-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/70">Profile Command Center</p>
                  <h1 className="mt-3 text-4xl font-semibold text-white leading-tight">
                    {parsedResume?.name || 'Your profile'}, perfectly packaged.
                  </h1>
                  <p className="mt-3 text-sm text-white/80 max-w-2xl">
                    Recruiters see verified skills, Watson-backed summaries, and salary signals in one glance. Keep everything crisp to unlock premium offers.
                  </p>
                  {resumeSummary && (
                    <div className="mt-4 rounded-2xl bg-white/10 border border-white/20 p-4 text-sm text-white/90">
                      {resumeSummary}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-white/80 text-sm">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5">
                    <Briefcase className="w-4 h-4" />
                    {parsedResume?.current_title || 'Role syncing'}
                  </span>
                  {parsedResume?.location && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5">
                      <MapPin className="w-4 h-4" />
                      {parsedResume.location}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5">
                    <Sparkles className="w-4 h-4" />
                    {parsedResume?.years_experience ? `${parsedResume.years_experience}+ yrs experience` : 'Experience syncing'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => navigate('/dashboard')} className="justify-center bg-white/10 border-white/30 text-white hover:bg-white/20">
                    Back to dashboard
                  </Button>
                  <Button onClick={() => setRefreshToken(Date.now())} className="justify-center">
                    Refresh profile
                  </Button>
                </div>
              </div>
            </Card>

            <Card tone="light" className="h-full">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Live signals</p>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Verified skills</p>
                    <p className="text-3xl font-semibold text-slate-900">{verifiedCount}</p>
                  </div>
                  <ShieldCheck className="w-10 h-10 text-emerald-500" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Role match</p>
                    <p className="text-3xl font-semibold text-slate-900">{bestRole?.matchPercentage || bestRole?.score || 72}%</p>
                  </div>
                  <Briefcase className="w-10 h-10 text-indigo-500" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Salary lift</p>
                    <p className="text-3xl font-semibold text-slate-900">{topSalaryBoost}</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-amber-500" />
                </div>
              </div>
            </Card>
          </motion.section>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[{
              id: 'verified',
              label: 'Verified skills',
              value: verifiedCount,
              hint: `${totalSkills} total`,
              icon: <ShieldCheck className="w-4 h-4" />,
              accent: 'text-emerald-600'
            }, {
              id: 'matches',
              label: 'Live matches',
              value: matchedJobs?.length || 0,
              hint: 'jobs.csv aligned',
              icon: <Briefcase className="w-4 h-4" />,
              accent: 'text-indigo-600'
            }, {
              id: 'skillMatch',
              label: 'Skill match',
              value: `${skillMatch}%`,
              hint: 'core role coverage',
              icon: <Sparkles className="w-4 h-4" />,
              accent: 'text-fuchsia-600'
            }, {
              id: 'resources',
              label: 'Learning paths',
              value: resources?.length || 0,
              hint: 'curated boosts',
              icon: <BookOpen className="w-4 h-4" />,
              accent: 'text-amber-600'
            }].map((stat) => (
              <Card key={stat.id} tone="light" className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{stat.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.hint}</p>
                </div>
                <div className={`w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center ${stat.accent}`}>
                  {stat.icon}
                </div>
              </Card>
            ))}
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr] items-start">
            <EnhancedProfileCard
              resumeId={resumeId || parsedResume?.resumeId}
              analysis={{
                bestRole: bestRole || { name: 'Analyzing...', score: 75 },
                tagline: parsedResume?.current_title || 'Professional',
                professionalSummary: resumeSummary || parsedResume?.bio || ''
              }}
              parsedResume={{
                name: parsedResume?.name,
                skills: parsedResume?.skills || [],
                years_experience: parsedResume?.years_experience || 0,
                experience: parsedResume?.experience || [],
                education: parsedResume?.education || [],
                contact: {
                  email: parsedResume?.email,
                  phone: parsedResume?.phone,
                  location: parsedResume?.location,
                  linkedin: parsedResume?.social_links?.linkedin,
                  github: parsedResume?.social_links?.github
                }
              }}
              onProfileLoaded={setProfileSnapshot}
              refreshToken={refreshToken}
            />

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="space-y-6"
            >
              <SkillsPanel
                skillsHave={skillsHaveData}
                skillsMissing={skillGaps?.skillsMissing || []}
                onVerifyClick={handleSkillVerify}
              />

              {resourcePreview.length > 0 && (
                <Card tone="light">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">In-flight resources</p>
                      <h3 className="text-lg font-semibold text-slate-900">Keep your momentum</h3>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate('/dashboard')}>
                      View all
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {resourcePreview.map((resource, idx) => (
                              <div key={resource.id || `${resource.title}-${idx}`} className="rounded-2xl border border-slate-200 p-4 bg-white">
                        <p className="text-sm font-semibold text-slate-900">{resource.title}</p>
                        <p className="text-xs text-slate-500">{resource.provider}</p>
                        <p className="mt-2 text-sm text-slate-600 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-slate-400" />
                          {resource.skills?.slice(0, 2).join(', ') || 'Curated learning path'}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <MCQVerificationModal
        isOpen={mcqModalOpen}
        onClose={() => setMcqModalOpen(false)}
        skill={selectedSkill}
        resumeId={resumeId || parsedResume?.resumeId}
        onVerificationComplete={handleVerificationComplete}
      />

      <Footer />
    </div>
  );
};

export default ProfilePage;
