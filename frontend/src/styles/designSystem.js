// Centralized design tokens used by the premium Resume Genie UI refresh.
// These tokens intentionally mirror Tailwind utilities so page components can
// stay declarative while still sharing one visual language.
export const palette = {
  midnight: '#020617',
  midnightAlt: '#030712',
  obsidian: '#0f172a',
  graphite: '#1e293b',
  slate: '#334155',
  mist: '#94a3b8',
  ice: '#e2e8f0',
  auroraBlue: '#38bdf8',
  auroraLavender: '#c084fc',
  auroraRose: '#fb7185',
  pulseGreen: '#34d399',
  signalYellow: '#fde047',
}

export const gradients = {
  hero: 'radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.15), transparent 55%), radial-gradient(circle at 80% 0%, rgba(192, 132, 252, 0.18), transparent 45%), linear-gradient(135deg, #050815 0%, #0f172a 60%, #030712 100%)',
  panel: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(8, 47, 73, 0.85))',
  pill: 'linear-gradient(135deg, #38bdf8, #c084fc)',
  accent: 'linear-gradient(135deg, #22d3ee, #34d399, #f472b6)',
  orangePulse: 'linear-gradient(135deg, #f97316, #fb7185)',
  limePulse: 'linear-gradient(135deg, #4ade80, #22d3ee)',
}

export const surfaces = {
  glass: 'rgba(15, 23, 42, 0.65)',
  glassElevated: 'rgba(15, 23, 42, 0.85)',
  outline: 'rgba(148, 163, 184, 0.25)',
  glowBorder: 'rgba(56, 189, 248, 0.45)',
}

export const effects = {
  softShadow: '0 25px 80px rgba(15, 23, 42, 0.65)',
  glowShadow: '0 10px 50px rgba(56, 189, 248, 0.45)',
  cardBorder: '1px solid rgba(148, 163, 184, 0.25)',
  blur: 'blur(24px)',
  glassBlur: 'blur(18px)',
}

export const typography = {
  hero: {
    fontFamily: 'Space Grotesk, Inter, sans-serif',
    lineHeight: 1.05,
    weight: 600,
  },
  body: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    lineHeight: 1.6,
    weight: 400,
  },
  mono: {
    fontFamily: 'IBM Plex Mono, SFMono-Regular, Menlo, monospace',
  },
}

export const layout = {
  maxWidth: '1280px',
  shellPadding: 'clamp(1.5rem, 4vw, 4rem)',
  gridGap: 'clamp(1rem, 2vw, 2.5rem)',
  panelRadius: '26px',
  pillRadius: '999px',
}

export const motion = {
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeIn: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  spring: { stiffness: 120, damping: 18 },
}

export const componentPresets = {
  pageShell: {
    background: gradients.hero,
    color: palette.ice,
    padding: layout.shellPadding,
  },
  glassPanel: {
    background: surfaces.glass,
    border: effects.cardBorder,
    boxShadow: effects.softShadow,
    backdropFilter: effects.glassBlur,
    borderRadius: layout.panelRadius,
  },
  badge: {
    background: gradients.pill,
    color: '#f8fafc',
    borderRadius: layout.pillRadius,
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
}

const designSystem = {
  palette,
  gradients,
  surfaces,
  effects,
  typography,
  layout,
  motion,
  componentPresets,
}

export default designSystem
