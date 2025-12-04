import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Upload, LayoutDashboard, LogIn, LogOut, User, Moon, SunMedium } from 'lucide-react'
import { useState } from 'react'
import Button from './Button'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => location.pathname === path

  const handleLogout = async () => {
    await logout()
    setIsMenuOpen(false)
    navigate('/')
  }

  const ThemeToggleButton = () => (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full border border-[var(--rg-border)] hover:bg-[var(--rg-surface-alt)] transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <Moon className="w-4 h-4" /> : <SunMedium className="w-4 h-4" />}
    </button>
  )

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--rg-surface)]/90 backdrop-blur-xl border-b border-[var(--rg-border)] text-[var(--rg-text-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg border border-[var(--rg-border)] flex items-center justify-center text-[var(--rg-text-primary)] font-semibold">
              RG
            </div>
            <span className="text-xl font-bold tracking-tight text-[var(--rg-text-primary)]">Resume Genie</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              to="/" 
              className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-[var(--rg-text-primary)]' : 'text-[var(--rg-text-secondary)] hover:text-[var(--rg-text-primary)]'}`}
            >
              Home
            </Link>
            <Link 
              to="/upload" 
              className={`text-sm font-medium transition-colors ${isActive('/upload') ? 'text-[var(--rg-text-primary)]' : 'text-[var(--rg-text-secondary)] hover:text-[var(--rg-text-primary)]'}`}
            >
              Upload Resume
            </Link>
            <Link 
              to="/dashboard" 
              className={`text-sm font-medium transition-colors ${isActive('/dashboard') ? 'text-[var(--rg-text-primary)]' : 'text-[var(--rg-text-secondary)] hover:text-[var(--rg-text-primary)]'}`}
            >
              Dashboard
            </Link>
            {isAuthenticated && (
              <Link 
                to="/profile" 
                className={`text-sm font-medium transition-colors ${isActive('/profile') ? 'text-[var(--rg-text-primary)]' : 'text-[var(--rg-text-secondary)] hover:text-[var(--rg-text-primary)]'}`}
              >
                Profile
              </Link>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggleButton />
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">
                  <Button variant="outline" size="sm">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--rg-bg-muted)] rounded-lg border border-[var(--rg-border)]">
                  <User className="w-4 h-4 text-[var(--rg-text-secondary)]" />
                  <span className="text-sm font-medium text-[var(--rg-text-primary)]">{user?.name || 'User'}</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg border border-[var(--rg-border)] hover:bg-[var(--rg-surface-alt)] transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-[var(--rg-border)] bg-[var(--rg-surface)]">
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Theme</span>
              <ThemeToggleButton />
            </div>
            <Link 
              to="/" 
              className="block px-4 py-2 text-sm font-medium rounded-lg hover:bg-[var(--rg-bg-muted)]"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            {isAuthenticated && (
              <>
                <Link 
                  to="/upload" 
                  className="block px-4 py-2 text-sm font-medium rounded-lg hover:bg-[var(--rg-bg-muted)]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Upload Resume
                </Link>
                <Link 
                  to="/dashboard" 
                  className="block px-4 py-2 text-sm font-medium rounded-lg hover:bg-[var(--rg-bg-muted)]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/profile" 
                  className="block px-4 py-2 text-sm font-medium rounded-lg hover:bg-[var(--rg-bg-muted)]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
              </>
            )}
            <div className="pt-3 border-t border-[var(--rg-border)] space-y-2">
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-2 bg-[var(--rg-bg-muted)] rounded-lg flex items-center gap-2 border border-[var(--rg-border)]">
                    <User className="w-4 h-4 text-[var(--rg-text-secondary)]" />
                    <span className="text-sm font-medium text-[var(--rg-text-primary)]">{user?.name || 'User'}</span>
                  </div>
                  <Button variant="outline" className="w-full" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      <LogIn className="w-4 h-4 mr-2" />
                      Login
                    </Button>
                  </Link>
                  <Link to="/register" className="block" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
