import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function linkClass({ isActive }) {
  return `px-2 py-1 text-[15px] font-medium tracking-[-0.02em] underline decoration-cream/40 underline-offset-4 transition-[color,translate,text-decoration-color] duration-200 hover:-translate-y-px hover:text-tomato hover:decoration-tomato ${
    isActive ? 'text-tomato decoration-tomato' : 'text-cream'
  }`
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  const navItems = [
    { to: '/events', label: 'Events', end: true },
    ...(user ? [{ to: '/events/new', label: 'Create' }, { to: '/dashboard', label: 'Dashboard' }] : []),
    ...(user?.role === 'admin' ? [{ to: '/admin/events', label: 'Admin' }] : []),
  ]

  // Lock the page scroll and support Escape while the sheet is open.
  useEffect(() => {
    if (!menuOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  function handleLogout() {
    logout()
    closeMenu()
    navigate('/')
  }

  const account = user ? (
    <>
      <span className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-full border-2 border-ink bg-tomato font-mono text-xs font-semibold text-ink shadow-[3px_3px_0_rgba(21,21,21,.2)]">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span className="hidden leading-tight lg:block">
          <span className="block text-sm font-semibold">{user.name}</span>
          <span className="block font-mono text-[10px] tracking-[0.1em] text-muted uppercase">
            {user.role === 'admin' ? 'Admin' : user.university}
          </span>
        </span>
      </span>
      <button type="button" className="btn btn-outline px-3 py-2" onClick={handleLogout}>
        Log out
      </button>
    </>
  ) : (
    <>
      <Link
        to="/login"
        onClick={closeMenu}
        className="text-sm font-semibold underline decoration-ink/30 underline-offset-4 transition-colors hover:text-tomato-deep"
      >
        Log in
      </Link>
      <Link to="/register" onClick={closeMenu} className="btn btn-dark px-3 py-2">
        Sign up <span aria-hidden="true">↗</span>
      </Link>
    </>
  )

  const mobileAccount = user ? (
    <>
      <span className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full border-2 border-cream bg-tomato font-mono text-sm font-semibold text-ink">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span className="leading-tight">
          <span className="block text-base font-semibold text-cream">{user.name}</span>
          <span className="block font-mono text-[10px] tracking-[0.1em] text-cream/60 uppercase">
            {user.role === 'admin' ? 'Admin' : user.university}
          </span>
        </span>
      </span>
      <button
        type="button"
        className="btn self-start border-cream bg-transparent px-4 py-2 text-cream hover:bg-cream hover:text-ink"
        onClick={handleLogout}
      >
        Log out
      </button>
    </>
  ) : (
    <>
      <Link to="/login" onClick={closeMenu} className="text-lg font-medium text-cream underline underline-offset-4">
        Log in
      </Link>
      <Link to="/register" onClick={closeMenu} className="btn btn-accent self-start px-5 py-2.5">
        Sign up <span aria-hidden="true">↗</span>
      </Link>
    </>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          to="/"
          onClick={closeMenu}
          className="flex -rotate-2 items-center gap-2 rounded-[3px] border-2 border-ink bg-cream px-3 py-2 shadow-[4px_4px_0_rgba(21,21,21,.18)] transition-transform duration-[400ms] ease-[cubic-bezier(.34,1.56,.64,1)] hover:rotate-0"
        >
          <span aria-hidden="true" className="text-xl leading-none text-tomato">
            ◒
          </span>
          <span className="text-base leading-none font-bold tracking-[-0.03em]">campus hub</span>
        </Link>

        {/* Desktop (lg and up): the black label strip, tilted like a sticker. */}
        <nav
          aria-label="Main"
          className="hidden rotate-[1.3deg] items-center gap-1 bg-ink px-2 py-2 shadow-[5px_4px_0_rgba(21,21,21,.25)] transition-transform duration-[400ms] ease-[cubic-bezier(.34,1.56,.64,1)] hover:rotate-0 lg:flex"
        >
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass} onClick={closeMenu}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-4 lg:flex">{account}</div>

        {/* Mobile menu button (below lg) */}
        <button
          type="button"
          className="relative z-40 flex size-11 flex-col justify-between p-2.5 lg:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span
            className={`block h-[3px] w-full transition-[translate,rotate,background-color] duration-300 ease-[cubic-bezier(.77,0,.175,1)] ${
              menuOpen ? 'translate-y-[9px] rotate-45 bg-cream' : 'bg-ink'
            }`}
          />
          <span
            className={`block h-[3px] w-full transition-opacity duration-200 ${menuOpen ? 'bg-cream opacity-0' : 'bg-ink'}`}
          />
          <span
            className={`block h-[3px] w-full transition-[translate,rotate,background-color] duration-300 ease-[cubic-bezier(.77,0,.175,1)] ${
              menuOpen ? '-translate-y-[9px] -rotate-45 bg-cream' : 'bg-ink'
            }`}
          />
        </button>
      </div>

      {/* Full-screen ink sheet with a circular reveal from the burger. */}
      <div
        id="mobile-nav"
        aria-hidden={!menuOpen}
        inert={!menuOpen}
        className={`fixed inset-0 z-30 bg-ink transition-[clip-path] duration-[450ms] ease-[cubic-bezier(.77,0,.175,1)] lg:hidden ${
          menuOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        style={{
          clipPath: menuOpen
            ? 'circle(150% at calc(100% - 42px) 40px)'
            : 'circle(0px at calc(100% - 42px) 40px)',
        }}
      >
        <nav
          aria-label="Mobile"
          className="relative flex h-full flex-col px-7 pt-24 pb-10 sm:px-10"
        >
          <p className="absolute top-10 left-7 flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-cream/40 uppercase sm:left-10">
            <span aria-hidden="true" className="text-tomato">✳</span> Menu
          </p>
          <div className="flex flex-1 flex-col justify-center gap-1">
            {navItems.map((item, index) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={closeMenu}
                style={{ transitionDelay: menuOpen ? `${index * 60 + 140}ms` : '0ms' }}
                className={({ isActive }) =>
                  `block w-fit py-1 text-[clamp(2.5rem,10vw,4rem)] leading-[0.95] font-medium tracking-[-0.045em] text-cream underline decoration-cream/25 underline-offset-8 transition-[opacity,translate,color] duration-300 ${
                    menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                  } ${isActive ? 'text-tomato' : 'hover:text-tomato'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <div className="flex flex-col gap-4 border-t border-cream/20 pt-6">{mobileAccount}</div>
          <p className="mt-8 font-mono text-[10px] tracking-[0.16em] text-cream/40 uppercase">
            Hong Kong · HKU · CUHK · PolyU
          </p>
        </nav>
      </div>
    </header>
  )
}
