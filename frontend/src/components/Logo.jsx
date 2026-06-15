/**
 * Logo.jsx — Expenzo animated brand logo
 *
 * Props:
 *   size      — 'sm' | 'md' | 'lg' (default: 'md')
 *   showText  — show/hide wordmark (default: true)
 *   className — extra wrapper classes
 *   animate   — enable floating loop animation (default: true)
 */

const sizes = {
  sm: { icon: 28, text: 'text-lg',  gap: 'gap-2'  },
  md: { icon: 38, text: 'text-2xl', gap: 'gap-2.5'},
  lg: { icon: 52, text: 'text-4xl', gap: 'gap-3'  },
}

const Logo = ({ size = 'md', showText = true, className = '', animate = true }) => {
  const s = sizes[size] || sizes.md
  const dim = s.icon

  return (
    <div
      className={`inline-flex items-center ${s.gap} ${animate ? 'animate-float' : ''} ${className}`}
      style={{ animationDelay: '0.1s' }}
    >
      {/* ── SVG Icon ─────────────────────────────────────── */}
      <div
        className="relative flex-shrink-0 animate-scale-in animate-pulse-glow rounded-2xl"
        style={{ width: dim, height: dim }}
      >
        {/* Glow layer */}
        <div
          className="absolute inset-0 rounded-2xl opacity-50 blur-md"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          }}
        />
        {/* Main SVG */}
        <svg
          width={dim}
          height={dim}
          viewBox="0 0 52 52"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 drop-shadow-lg"
          aria-label="Expenzo logo icon"
        >
          {/* Background rounded square */}
          <rect width="52" height="52" rx="14" fill="url(#logoGrad)" />

          {/* Shimmer overlay */}
          <rect width="52" height="52" rx="14" fill="url(#logoShimmer)" opacity="0.3" />

          {/* Stylized "E" with split arrows */}
          {/* Horizontal bars */}
          <rect x="13" y="14" width="22" height="4" rx="2" fill="white" />
          <rect x="13" y="24" width="16" height="4" rx="2" fill="white" opacity="0.85" />
          <rect x="13" y="34" width="22" height="4" rx="2" fill="white" />

          {/* Split arrow — upper right */}
          <path
            d="M35 10 L43 17 L35 17"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.9"
          />
          {/* Split arrow — lower right */}
          <path
            d="M35 42 L43 35 L35 35"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.9"
          />

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="52" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#7c3aed" />
              <stop offset="60%"  stopColor="#5b21b6" />
              <stop offset="100%" stopColor="#4338ca" />
            </linearGradient>
            <linearGradient id="logoShimmer" x1="0" y1="0" x2="52" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="white" stopOpacity="0" />
              <stop offset="50%"  stopColor="white" stopOpacity="0.5" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* ── Wordmark ─────────────────────────────────────── */}
      {showText && (
        <span
          className={`font-display font-bold tracking-tight ${s.text} animate-fade-in`}
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 60%, #818cf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animationDelay: '0.15s',
          }}
        >
          Expenzo
        </span>
      )}
    </div>
  )
}

export default Logo
