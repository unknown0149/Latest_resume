import clsx from 'clsx'

const toneClasses = {
  light: 'bg-[var(--rg-surface)] border border-[var(--rg-border)] text-[var(--rg-text-primary)] shadow-soft',
  muted: 'bg-[var(--rg-surface-alt)] border border-[var(--rg-border)] text-[var(--rg-text-primary)] shadow-soft',
  strong: 'bg-[var(--rg-surface-strong)] border border-[var(--rg-border-strong)] text-[var(--rg-text-primary)] shadow-soft',
  glass: 'bg-[var(--rg-surface)] border border-[var(--rg-border)] text-[var(--rg-text-primary)] shadow-soft',
  midnight: 'bg-[var(--rg-surface-strong)] border border-[var(--rg-border-strong)] text-[var(--rg-text-primary)] shadow-soft',
}

const Card = ({ 
  children, 
  className = '', 
  hover = false,
  gradient = false,
  tone = 'light',
  padding = 'p-6',
  ...props 
}) => {
  return (
    <div
      className={clsx(
        'rounded-[26px] transition-all duration-300',
        toneClasses[tone] || toneClasses.light,
        padding,
        hover && 'card-hover cursor-pointer hover:-translate-y-1',
        gradient && 'bg-gradient-to-br from-[#111112] to-[#1f1f21] text-white',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
