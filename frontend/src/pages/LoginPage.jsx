import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, ArrowRight, AlertCircle, ShieldCheck, Sparkles, Zap, CheckCircle2 } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'

const LOGIN_BASE_COPY = {
  title: 'Welcome back, chief architect',
  subtitle: 'Resume Genie kept the runway warm. Pick up exactly where your playbook left off.'
}

const CHAD_LINES = [
  {
    title: 'Secure session ignited.',
    subtitle: 'We lock the door, dim the lights, and surface the next lofty target.'
  },
  {
    title: 'Signal synced to the boardroom.',
    subtitle: 'Every recruiter pulse is streaming to your console. Glide in with confidence.'
  },
  {
    title: 'Precision throttle engaged.',
    subtitle: 'Optimizing your resume intelligence stack before we hand you the controls.'
  },
  {
    title: 'Chad clearance received.',
    subtitle: 'We whisper to the hiring graph, then swing the doors wide open for you.'
  }
]

const HERO_HIGHLIGHTS = [
  { label: 'Time to offer', value: '31 days avg', icon: Zap },
  { label: 'Fit score accuracy', value: '97.2%', icon: ShieldCheck },
  { label: 'AI calibrations', value: '2,400+ /month', icon: Sparkles }
]

const HERO_BULLETS = [
  'Live calibration with every upload',
  'Private talent intelligence feed',
  'Designer-grade resume orchestration'
]

const FORM_ASSURANCES = [
  { label: 'SOC 2 Type II', detail: 'Independent audit complete' },
  { label: 'SSO ready', detail: 'Okta • Google • email link' }
]

const SESSION_TESTIMONIAL = {
  quote: 'Resume Genie quietly replaced three disjointed tools and keeps my resume market-ready in the background.',
  author: 'Anjali Singh',
  role: 'Growth PM, Verse Labs'
}

const LoginPage = () => {
  const navigate = useNavigate()
  const { login, isAuthenticated, loading } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [heroCopy, setHeroCopy] = useState(LOGIN_BASE_COPY)
  const [chadPulse, setChadPulse] = useState(false)

  // Redirect if already authenticated (only after initial auth check is complete)
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  const triggerChadCopy = () => {
    const nextLine = CHAD_LINES[Math.floor(Math.random() * CHAD_LINES.length)]
    setHeroCopy(nextLine)
    setChadPulse(true)
  }

  const resetHeroCopy = () => {
    setHeroCopy({ ...LOGIN_BASE_COPY })
    setChadPulse(false)
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

    if (!formData.email || !formData.password) {
      setError('Email and password are required')
      return
    }

    triggerChadCopy()
    setIsLoading(true)

    try {
      const result = await login(formData.email, formData.password)
      
      if (result.success) {
        // Successful login - navigate to upload page
        navigate('/upload')
      } else {
        setError(result.message || 'Invalid email or password')
        setIsLoading(false)
        resetHeroCopy()
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Login failed. Please try again.')
      setIsLoading(false)
      resetHeroCopy()
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080c16] px-6 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.15),transparent_60%),radial-gradient(circle_at_20%_40%,rgba(59,130,246,0.12),transparent_50%)]" />
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
        className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]"
      >
        <div className="relative flex flex-col justify-between overflow-hidden rounded-[34px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
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
              <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-semibold tracking-wide ${chadPulse ? 'border-emerald-300/60 text-emerald-200' : 'border-white/15 text-white/70'}`}>
                <span className={`h-2 w-2 rounded-full ${chadPulse ? 'bg-emerald-300 animate-pulse' : 'bg-white/40'}`} />
                {chadPulse ? 'Syncing credentials' : 'Perimeter idle'}
              </div>
            </div>

            <div className="space-y-5">
              <p className="text-[11px] uppercase tracking-[0.5em] text-white/60">Client console</p>
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
              <p className="text-[11px] uppercase tracking-[0.4em] text-white/60">This session unlocks</p>
              <div className="mt-4 space-y-4">
                {HERO_BULLETS.map((bullet) => (
                  <div key={bullet} className="flex items-start gap-3 text-sm text-white/85">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative mt-8 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {HERO_HIGHLIGHTS.map(({ label, value, icon: Icon }) => (
                <motion.div
                  key={label}
                  whileHover={{ y: -4 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <Icon className="mb-2 h-5 w-5 text-white" />
                  <p className="text-[11px] uppercase tracking-[0.35em] text-white/55">{label}</p>
                  <p className="mt-1 text-lg font-semibold text-white">{value}</p>
                </motion.div>
              ))}
            </div>

            <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-white/10 to-transparent p-6">
              <p className="text-sm italic text-white/80">“{SESSION_TESTIMONIAL.quote}”</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-sm font-semibold text-white">
                  {SESSION_TESTIMONIAL.author
                    .split(' ')
                    .map((word) => word[0])
                    .join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{SESSION_TESTIMONIAL.author}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">{SESSION_TESTIMONIAL.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="w-full"
        >
          <Card className="!bg-white/95 rounded-[34px] border border-slate-100/80 p-10 shadow-[0_50px_140px_rgba(8,12,22,0.15)]">
            <div className="mb-8">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.4em] text-slate-400">
                <span>Login</span>
                <span className="text-slate-300">Single sign-on ready</span>
              </div>
              <h2 className="mt-3 text-[34px] font-semibold text-slate-900">Access your control tower</h2>
              <p className="mt-2 text-sm text-slate-500">We pre-load your resume intelligence layers before you land.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 text-base text-slate-900 placeholder:text-slate-300 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    placeholder="you@studio.com"
                    required
                  />
                </div>
              </div>

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
                    className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 text-base text-slate-900 placeholder:text-slate-300 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Need a hint? Use the email you registered with.</span>
                <button type="button" className="font-semibold text-slate-900 hover:underline">
                  Forgot?
                </button>
              </div>

              <Button
                type="submit"
                className="group relative w-full overflow-hidden rounded-2xl bg-slate-900 px-6 py-4 text-base font-semibold text-white"
                disabled={isLoading}
              >
                <span className="relative z-10 flex w-full items-center justify-center gap-2">
                  {isLoading ? 'Verifying session…' : 'Continue to dashboard'}
                  <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
                <span className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </Button>
            </form>

            <div className="mt-8 grid gap-4 rounded-2xl bg-slate-50/70 p-4 text-sm text-slate-600 sm:grid-cols-2">
              {FORM_ASSURANCES.map(({ label, detail }) => (
                <div key={label}>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{label}</p>
                  <p className="mt-1 text-sm text-slate-600">{detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
              <span>Need to onboard someone new?</span>
              <Link to="/register" className="font-semibold text-slate-900 visited:text-slate-900">
                Create access
              </Link>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default LoginPage
