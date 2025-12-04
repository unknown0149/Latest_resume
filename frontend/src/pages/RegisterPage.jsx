import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, AlertCircle, Sparkles, Rocket, Layers, CheckCircle2 } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'

const REGISTER_BASE_COPY = {
  title: 'Create your founder-grade workspace',
  subtitle: 'Give Resume Genie 7 minutes and we will build the career cockpit you wished existed.'
}

const REGISTER_CHAD_LINES = [
  {
    title: 'Access token sculpted.',
    subtitle: 'We emboss your workspace credentials before ushering you inside the suite.'
  },
  {
    title: 'Invite drafted for the hiring gods.',
    subtitle: 'Your name is being stitched into the private talent graph in real time.'
  },
  {
    title: 'Blueprint printers warmed.',
    subtitle: 'We render a bespoke workflow and only then open the doors.'
  },
  {
    title: 'Chad concierge notified.',
    subtitle: 'Sit tight while we switch on every sensor for your profile.'
  }
]

const REGISTER_BADGES = [
  { title: 'Curated prompts', caption: 'Daily momentum cues', icon: Sparkles },
  { title: 'Hiring graph sync', caption: 'Live market telemetry', icon: Layers },
  { title: 'Launch rituals', caption: 'Weekly accountability', icon: Rocket }
]

const REGISTER_BULLETS = [
  'Setup audit + narrative polishing',
  'Connected workflows across resume, ATS, and outreach',
  'Trusted by operators at 200+ venture-backed teams'
]

const REGISTER_ASSURANCES = [
  { label: 'Private cloud', detail: 'US + EU data residency' },
  { label: 'Human concierge', detail: 'Real strategist in the loop' }
]

const REGISTER_TESTIMONIAL = {
  quote: 'The onboarding flow feels like a private atelier session—Resume Genie nails every microscopic detail.',
  author: 'Leon Chen',
  role: 'Design Lead, Alloy'
}

const RegisterPage = () => {
  const navigate = useNavigate()
  const { register, isAuthenticated, loading } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [heroCopy, setHeroCopy] = useState(REGISTER_BASE_COPY)
  const [isChadAnimating, setIsChadAnimating] = useState(false)

  // Redirect if already authenticated (only after initial auth check is complete)
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  const triggerChadCopy = () => {
    const nextLine = REGISTER_CHAD_LINES[Math.floor(Math.random() * REGISTER_CHAD_LINES.length)]
    setHeroCopy(nextLine)
    setIsChadAnimating(true)
  }

  const resetHeroCopy = () => {
    setHeroCopy({ ...REGISTER_BASE_COPY })
    setIsChadAnimating(false)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('All fields are required')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    triggerChadCopy()
    setIsLoading(true)

    try {
      const result = await register(formData.name, formData.email, formData.password)
      
      if (result.success) {
        // Successful registration - navigate to upload page
        navigate('/upload')
      } else {
        setError(result.message || 'Registration failed')
        setIsLoading(false)
        resetHeroCopy()
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('Registration failed. Please try again.')
      setIsLoading(false)
      resetHeroCopy()
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080c16] px-6 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(236,72,153,0.18),transparent_45%)]" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: '44px 44px',
          opacity: 0.45
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr]"
      >
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="relative flex flex-col justify-between overflow-hidden rounded-[34px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-70" />
          <div className="relative space-y-8">
            <div className="flex items-center justify-between gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white visited:text-white"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-black text-slate-900">
                  RG
                </span>
                Back to site
              </Link>
              <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-semibold tracking-wide ${isChadAnimating ? 'border-rose-300/60 text-rose-100' : 'border-white/15 text-white/70'}`}>
                <span className={`h-2 w-2 rounded-full ${isChadAnimating ? 'bg-rose-300 animate-pulse' : 'bg-white/40'}`} />
                {isChadAnimating ? 'Minting workspace' : 'Standing by'}
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-[11px] uppercase tracking-[0.5em] text-white/60">New account</p>
              <div className="min-h-[160px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={heroCopy.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                  >
                    <h1 className="text-4xl font-semibold leading-tight text-white md:text-[46px]">
                      {heroCopy.title}
                    </h1>
                    <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70">
                      {heroCopy.subtitle}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.35)]">
              <p className="text-[11px] uppercase tracking-[0.4em] text-white/60">What you get</p>
              <div className="mt-4 space-y-4">
                {REGISTER_BULLETS.map((bullet) => (
                  <div key={bullet} className="flex items-start gap-3 text-sm text-white/85">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-rose-300" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative mt-8 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {REGISTER_BADGES.map(({ title, caption, icon: Icon }) => (
                <motion.div key={title} whileHover={{ y: -4 }} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Icon className="mb-2 h-5 w-5 text-white" />
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-slate-200">{caption}</p>
                </motion.div>
              ))}
            </div>

            <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-white/10 to-transparent p-6">
              <p className="text-sm italic text-white/80">“{REGISTER_TESTIMONIAL.quote}”</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-sm font-semibold text-white">
                  {REGISTER_TESTIMONIAL.author
                    .split(' ')
                    .map((word) => word[0])
                    .join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{REGISTER_TESTIMONIAL.author}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">{REGISTER_TESTIMONIAL.role}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="w-full"
        >
          <Card className="!bg-white/95 rounded-[34px] border border-slate-100/80 p-10 shadow-[0_50px_140px_rgba(8,12,22,0.15)]">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-400">Register</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">Build your private workspace</h2>
                <p className="mt-2 text-sm text-slate-500">We pair you with AI copilots tuned for operators.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                Step 1 of 1
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="name" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Full name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 text-base text-slate-900 placeholder:text-slate-300 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                    placeholder="Maya Solaris"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Work email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 text-base text-slate-900 placeholder:text-slate-300 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                    placeholder="you@studio.com"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 text-base text-slate-900 placeholder:text-slate-300 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 text-base text-slate-900 placeholder:text-slate-300 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="group relative w-full overflow-hidden rounded-2xl bg-slate-900 px-6 py-4 text-base font-semibold text-white"
                disabled={isLoading}
              >
                <span className="relative z-10 flex w-full items-center justify-center gap-2">
                  {isLoading ? 'Crafting workspace…' : 'Create account'}
                  <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
                <span className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </Button>
            </form>

            <div className="mt-8 grid gap-4 rounded-2xl bg-slate-50/70 p-4 text-sm text-slate-600 sm:grid-cols-2">
              {REGISTER_ASSURANCES.map(({ label, detail }) => (
                <div key={label}>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{label}</p>
                  <p className="mt-1 text-sm text-slate-600">{detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
              <span>Already part of the network?</span>
              <Link to="/login" className="font-semibold text-slate-900 visited:text-slate-900">
                Sign in
              </Link>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default RegisterPage
