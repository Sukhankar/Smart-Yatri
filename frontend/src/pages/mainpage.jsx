import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import busLogo from "../assets/bus-logo.png";

/**
 * HomePage - polished professional UI with an updated mobile experience.
 * Redesigned mobile navigation for a more modern, bottom-sheet style look.
 */
export default function HomePage() {
  const [navOpen, setNavOpen] = useState(false);
  const menuRef = useRef(null);

  // Prevent background scrolling when mobile nav is open
  useEffect(() => {
    if (navOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  // Focus trap and Escape for mobile nav
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") {
        setNavOpen(false);
      }
      if (!navOpen) return;

      if (e.key === "Tab") {
        const focusables = menuRef.current
          ? menuRef.current.querySelectorAll(
              'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
            )
          : null;
        if (!focusables || focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last && last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first && first.focus();
          }
        }
      }
    }

    if (navOpen) {
      setTimeout(() => {
        const focusables = menuRef.current
          ? menuRef.current.querySelectorAll(
              'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
            )
          : null;
        if (focusables && focusables.length > 0) {
          focusables[0].focus();
        }
      }, 50);
      document.addEventListener("keydown", onKeyDown);
    } else {
      document.removeEventListener("keydown", onKeyDown);
    }

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [navOpen]);

  // Handle mobile nav close
  const onOverlayClick = () => setNavOpen(false);

  return (
    <main className="relative min-h-screen w-full bg-gradient-to-br from-blue-100 via-white to-blue-200 flex flex-col overflow-x-hidden">
      {/* Decorative blobs */}
      <div
        className="absolute top-0 left-0 w-60 h-60 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-blue-200 rounded-full mix-blend-lighten blur-2xl opacity-40 -z-10 pointer-events-none"
        style={{ filter: "blur(80px)", top: "-4rem", left: "-2rem" }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 right-0 w-48 h-48 sm:w-60 sm:h-60 lg:w-72 lg:h-72 bg-blue-300 rounded-full mix-blend-lighten blur-2xl opacity-30 -z-10 pointer-events-none"
        style={{ filter: "blur(65px)", bottom: "-2rem", right: "-2rem" }}
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 left-0 w-44 h-40 sm:w-56 sm:h-52 lg:w-72 lg:h-64 bg-purple-100 rounded-full blur-3xl opacity-20 -z-10 pointer-events-none"
        style={{ filter: "blur(40px)", top: "53%", left: "-2rem" }}
        aria-hidden="true"
      />

      {/* Skip link for keyboard users */}
      {/* 
        In JSX (React), files must be named with .jsx or .tsx if using JSX syntax.
        The code below is valid JSX and must reside in the correct file extension.
      */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-white/90 text-blue-700 px-3 py-2 rounded-md shadow"
      >
        Skip to content
      </a>

      {/* Header */}
      <header
        role="banner"
        className="w-full max-w-[100vw] px-3 sm:px-6 md:px-12 py-2 flex items-center justify-between bg-white/80 shadow-md backdrop-blur-xl sticky top-0 z-40 border-b border-blue-200/40"
      >
        <div className="flex items-center gap-3 md:gap-4">
          <Link to="/" aria-label="SmartYatri homepage" className="flex items-center gap-2">
            <img
              src={busLogo}
              alt="SmartYatri logo (bus icon)"
              className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-md"
              width={40}
              height={40}
              loading="eager"
            />
            <span className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-800 tracking-tight font-sans select-none">
              SmartYatri
            </span>
          </Link>
          <span className="sr-only">Professional bus ticketing and passes</span>
        </div>

        {/* Desktop navigation */}
        <nav
          role="navigation"
          aria-label="Primary"
          className="hidden md:flex gap-2 lg:gap-5 items-center"
        >
          <Link to="/Booking" className="nav-link">
            Book Ticket
          </Link>
          <Link to="/Pass" className="nav-link">
            My Pass
          </Link>
          <Link to="/Login" className="nav-link">
            Login
          </Link>
          <Link
            to="/Signup"
            className="bg-gradient-to-tr from-blue-700 to-blue-600 text-white rounded-2xl px-5 py-2 font-semibold shadow-lg hover:brightness-110 focus-visible:ring-2 focus-visible:ring-blue-400 transition-all duration-200 text-[15px]"
          >
            Get Started
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <div className="md:hidden flex items-center">
          <button
            type="button"
            className="inline-flex items-center justify-center p-2.5 rounded-lg text-blue-700 border border-blue-200 bg-white/70 shadow hover:bg-blue-50 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={navOpen ? "Close menu" : "Open menu"}
            aria-expanded={navOpen}
            aria-controls="mobile-menu"
            onClick={() => setNavOpen((open) => !open)}
          >
            {/* Animated hamburger / close */}
            <svg width="27" height="27" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <g className={`transform transition-all duration-300 ${navOpen ? "opacity-0 scale-90" : "opacity-100 scale-100"}`}>
                <rect x="3" y="5" width="18" height="2" rx="1" fill="#2563eb" />
                <rect x="3" y="11" width="18" height="2" rx="1" fill="#2563eb" />
                <rect x="3" y="17" width="18" height="2" rx="1" fill="#2563eb" />
              </g>
              <g className={`absolute transition-all duration-300 ${navOpen ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
                <path d="M5 5L19 19" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19 5L5 19" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
          </button>
        </div>
      </header>

      {/* Redesigned Mobile nav: glassy bottom-sheet with large actions, avatar, etc */}
      <div
        id="mobile-menu"
        aria-hidden={!navOpen}
        className={`md:hidden fixed z-[100] inset-0 flex items-end justify-center bg-black/35 transition-all duration-300 ${navOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onOverlayClick}
      >
        <nav
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
          className="w-full max-w-md mx-auto bottom-0 bg-white rounded-t-3xl shadow-2xl border border-blue-100 flex flex-col px-6 py-7 gap-1 relative transition-all duration-300"
          style={{
            transform: navOpen ? "translateY(0)" : "translateY(100px)",
            transition: "transform .35s cubic-bezier(.72,.12,.18,1), opacity .15s",
            minHeight: 380,
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-center mb-4">
            {/* drag indicator */}
            <span className="h-1.5 w-12 bg-slate-200 rounded-full block" />
          </div>
          <div className="flex items-center gap-3 pb-3 border-b border-blue-100 mb-2">
            <img
              src={busLogo}
              alt="SmartYatri logo"
              width={36}
              height={36}
              className="rounded"
              loading="eager"
            />
            <span className="text-lg font-semibold text-blue-900 mr-auto">SmartYatri</span>
            <button
              className="text-3xl text-blue-500 font-bold px-2 py-1 rounded focus-visible:ring-2 focus-visible:ring-blue-400 hover:bg-blue-50"
              onClick={() => setNavOpen(false)}
              aria-label="Close menu"
              tabIndex={0}
            >
              &times;
            </button>
          </div>
          <div className="w-full flex flex-col mt-2 mb-4 gap-1">
            <Link
              to="/Booking"
              className="w-full flex items-center gap-3 rounded-2xl px-5 py-4 text-blue-700 font-bold text-lg bg-gradient-to-tr from-blue-50 via-blue-100 to-blue-50 shadow-sm mb-2 transition hover:bg-blue-100/60 focus-visible:ring-2 focus-visible:ring-blue-300"
              onClick={() => setNavOpen(false)}
            >
              <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="5" y="7" width="14" height="10" rx="3" stroke="currentColor" strokeWidth="2"></rect>
                <path d="M8 11h8M8 15h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Book Ticket
            </Link>
            <Link
              to="/Pass"
              className="w-full flex items-center gap-3 rounded-2xl px-5 py-4 text-blue-800 font-semibold text-lg bg-blue-50 hover:bg-blue-100/80 shadow-sm mb-2 transition focus-visible:ring-2 focus-visible:ring-blue-300"
              onClick={() => setNavOpen(false)}
            >
              <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="5" y="7" width="14" height="10" rx="3" stroke="currentColor" strokeWidth="2"></rect>
                <path d="M12 13v2m-2 0h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              My Pass
            </Link>
            <Link
              to="/Login"
              className="w-full flex items-center gap-3 rounded-2xl px-5 py-4 text-blue-700 font-semibold text-lg bg-blue-50 hover:bg-blue-200/70 shadow-sm mb-2 transition focus-visible:ring-2 focus-visible:ring-blue-300"
              onClick={() => setNavOpen(false)}
            >
              <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M16 17v1a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3h6a3 3 0 013 3v1" stroke="currentColor"/>
                <path d="M21 12l-4-4v3H9v2h8v3z" stroke="currentColor" />
              </svg>
              Login
            </Link>
            <Link
              to="/Signup"
              className="w-full flex items-center gap-3 rounded-2xl px-5 py-4 text-white font-bold text-lg bg-gradient-to-tr from-blue-700 to-blue-600 shadow-lg mb-2 transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-blue-400"
              onClick={() => setNavOpen(false)}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" stroke="currentColor"/>
                <path d="M9 12l2 2l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Get Started
            </Link>
          </div>
          <div className="w-full flex flex-col items-center mt-auto pt-1">
            <a href="mailto:support@smartyatri.app" className="text-blue-700 mb-2 underline underline-offset-2 text-base font-medium">Need help? support@smartyatri.app</a>
            <span className="text-xs text-blue-600/60 opacity-80 mb-2">&copy; {new Date().getFullYear()} SmartYatri</span>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <section id="main-content" className="relative flex-1 w-full flex flex-col md:flex-row items-center justify-center px-3 sm:px-7 md:px-16 xl:px-36 pb-10 pt-8 gap-8 md:gap-20 transition-all duration-500 z-10">
        {/* Left: Headline and Actions */}
        <div className="w-full max-w-2xl space-y-7">
          <h1 className="font-bold leading-tight text-blue-900 text-[2.15rem] sm:text-[2.6rem] md:text-[3.1rem] tracking-tight animate-fade-in-down">
            <span className="bg-gradient-to-tr from-blue-700 to-blue-500 bg-clip-text text-transparent animate-gradient font-bold">
              SmartYatri
            </span>{" "}
            <span className="hidden sm:inline">–</span>
            <span className="block sm:inline">Your Smart Way to Travel</span>
          </h1>
          <p className="text-[1.08rem] sm:text-[1.23rem] md:text-[1.30rem] text-blue-800/85 mt-2 animate-fade-in-down font-normal">
            <strong>SmartYatri</strong> is the professional platform for modern daily travel. Book tickets, manage passes, or plan trips with a clear, reliable experience. Trusted by commuters and designed for your convenience.
          </p>
          <div className="flex flex-col xs:flex-row gap-3 xs:gap-4 items-stretch sm:items-center animate-fade-in-up mt-2 mb-1">
            <Link
              to="/Booking"
              className="bg-blue-700 hover:bg-blue-800 transition-all text-white px-6 py-3 rounded-2xl font-semibold shadow text-[17px] ring-1 ring-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400 animate-bounce-in text-center"
            >
              Book Now
            </Link>
            <Link
              to="/Signup"
              className="px-6 py-3 rounded-2xl border-2 border-blue-700 text-blue-700 bg-white/90 hover:bg-blue-50 font-medium shadow text-[17px] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-400 text-center"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Right: Illustration */}
        <div className="w-full max-w-sm flex-1 flex items-center justify-center mt-4 md:mt-0 animate-fade-in-up">
          <div className="relative bg-white/90 rounded-2xl shadow-lg px-1 sm:px-4 py-4 sm:py-6 md:py-10 flex items-center justify-center border border-blue-100/50 backdrop-blur-lg w-full max-w-xs sm:max-w-sm md:max-w-xs">
            {/* SVG Illustration (kept professional, accessible) */}
            <svg
              viewBox="0 0 320 180"
              className="w-full max-w-xs sm:max-w-sm md:max-w-md drop-shadow-2xl"
              style={{ minWidth: "120px" }}
              aria-label="Professional Bus Booking Illustration"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
            >
              <rect x="32" y="78" rx="19" width="250" height="56" fill="#2563EB" />
              <rect x="48" y="90" rx="4" width="36" height="18" fill="#fff" opacity="0.95" />
              <rect x="88" y="90" rx="4" width="36" height="18" fill="#fff" opacity="0.92" />
              <rect x="128" y="90" rx="4" width="36" height="18" fill="#fff" opacity="0.90" />
              <rect x="168" y="90" rx="4" width="36" height="18" fill="#fff" opacity="0.93" />
              <rect x="210" y="92" rx="3" width="26" height="24" fill="#f1f5f9" stroke="#2563EB" strokeWidth="1" />
              <rect x="242" y="92" rx="5" width="24" height="22" fill="#93c5fd" stroke="#2563EB" strokeWidth="1" opacity="0.83" />
              <circle cx="70" cy="136" r="15" fill="#111827" />
              <circle cx="70" cy="136" r="7" fill="#fde68a" />
              <circle cx="236" cy="136" r="15" fill="#111827" />
              <circle cx="236" cy="136" r="7" fill="#fde68a" />
              <ellipse cx="281" cy="106" rx="4" ry="7" fill="#fde047" />
              <ellipse cx="281" cy="122" rx="4" ry="3" fill="#fff7ae" />
              <rect x="45" y="126" width="30" height="5" rx="2.5" fill="#1e40af" opacity="0.18" />
              <rect x="178" y="127" width="20" height="4.5" rx="2.2" fill="#1e40af" opacity="0.18" />
              <rect x="24" y="150" rx="7" width="270" height="13" fill="#64748b" opacity="0.16" />
              <circle cx="160" cy="72" r="60" fill="#60a5fa" opacity="0.09" />
            </svg>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="w-full bg-white/95 py-9 sm:py-14 px-3 sm:px-5 md:px-0 flex flex-col items-center border-t border-blue-100/60 shadow-inner z-20">
        <h2 className="text-[1.6rem] sm:text-[2.28rem] md:text-[2.85rem] font-bold text-blue-900 text-center mb-6 sm:mb-12 tracking-tight animate-fade-in-down">
          ⭐ Key Features
        </h2>
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-9 max-w-7xl">
          {/* Reusable card (kept mostly same design but tightened spacing) */}
          {[
            {
              title: "Instant Ticket Booking",
              desc: "Find buses, check seat availability, and book tickets in seconds.",
              colorFrom: "from-blue-50",
              colorTo: "to-blue-100",
              icon: (
                <svg width="34" height="34" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                  <circle cx="19" cy="19" r="18" fill="#3B82F6" opacity="0.13" />
                  <path d="M28 16v7a5 5 0 01-5 5H15a5 5 0 01-5-5v-7" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ),
            },
            {
              title: "Digital Bus Passes",
              desc: "Create, renew, and manage your bus passes anytime.",
              colorFrom: "from-green-50",
              colorTo: "to-blue-100",
              icon: (
                <svg width="34" height="34" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                  <circle cx="19" cy="19" r="18" fill="#10B981" opacity="0.15" />
                  <path d="M20 12v7l5 3" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ),
            },
            {
              title: "Real-Time Updates",
              desc: "Live bus timings, delays, and route information.",
              colorFrom: "from-orange-50",
              colorTo: "to-blue-100",
              icon: (
                <svg width="34" height="34" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                  <circle cx="19" cy="19" r="18" fill="#f59e42" opacity="0.10" />
                  <path d="M15 25l10-10M15 15h10v10" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ),
            },
            {
              title: "Secure Payments",
              desc: "Fast and safe online payment options.",
              colorFrom: "from-purple-50",
              colorTo: "to-blue-100",
              icon: (
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <circle cx="16" cy="16" r="14" fill="#a78bfa" opacity="0.12" />
                  <path d="M10 22v-2a4 4 0 014-4h2a4 4 0 014 4v2" stroke="#7c3aed" strokeWidth="2" />
                </svg>
              ),
            },
            {
              title: "User-Friendly Design",
              desc: "Clean interface built for all age groups.",
              colorFrom: "from-slate-100",
              colorTo: "to-blue-100",
              icon: (
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <circle cx="16" cy="16" r="14" fill="#3b82f6" opacity="0.07" />
                  <rect x="9" y="12" width="14" height="8" rx="3" stroke="#2563eb" strokeWidth="2" />
                </svg>
              ),
            },
            {
              title: "Booking History",
              desc: "Track your past tickets and manage future trips.",
              colorFrom: "from-teal-50",
              colorTo: "to-blue-100",
              icon: (
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <circle cx="16" cy="16" r="14" fill="#14b8a6" opacity="0.09" />
                  <rect x="10" y="11" width="12" height="10" rx="2" stroke="#14b8a6" strokeWidth="2" />
                </svg>
              ),
            },
          ].map((f, i) => (
            <div
              key={i}
              className={`group relative bg-gradient-to-tr ${f.colorFrom}/95 ${f.colorTo}/90 rounded-3xl p-6 sm:p-8 md:p-9 pt-12 shadow-lg flex flex-col items-center text-center hover:-translate-y-1.5 hover:shadow-[0px_12px_48px_-16px_rgba(59,130,246,0.085)] hover:ring-2 hover:ring-blue-200/70 transition-all duration-300 overflow-hidden`}
            >
              <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white/10 rounded-full h-14 w-14 sm:h-16 sm:w-16 flex items-center justify-center">
                {f.icon}
              </div>
              <h3 className="font-semibold text-[1.08rem] sm:text-[1.17rem] mt-4 sm:mt-6 mb-1 sm:mb-2 text-blue-700">{f.title}</h3>
              <p className="text-blue-900/75 text-[1.04rem] sm:text-[1.12rem] font-normal">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why SmartYatri */}
      <section className="w-full py-8 sm:py-14 px-3 sm:px-5 md:px-0 flex flex-col items-center border-t border-blue-100/70 bg-gradient-to-br from-blue-50/50 to-white/90 z-10">
        <h2 className="text-[1.5rem] sm:text-[2.1rem] md:text-[2.85rem] font-bold text-blue-900 text-center mb-5 sm:mb-10 tracking-tight animate-fade-in-down">
          🎯 Why SmartYatri?
        </h2>
        <div className="max-w-2xl mx-auto text-center text-blue-800/95 text-[1.05rem] sm:text-[1.22rem] font-medium animate-fade-in-up">
          SmartYatri is built to reduce waiting, simplify travel planning and deliver a smarter, professional commute. Powerful features, seamless design: the pro companion for students, office commuters, and travelers.
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-7 px-3 sm:px-7 md:px-20 bg-gradient-to-r from-blue-900 to-blue-800 text-slate-50 flex flex-col md:flex-row items-center justify-between mt-auto border-t border-blue-950/20 shadow-2xl z-30">
        <div className="text-[15px] sm:text-[16px] opacity-85 font-normal flex items-center gap-2 select-none">
          <svg width="20" height="20" className="inline mr-1 mb-0.5" fill="none" viewBox="0 0 20 20" aria-hidden="true">
            <rect width="20" height="20" rx="6" fill="#2563eb" />
            <path d="M5 14V8.5A4 4 0 0113.4 6.2l.1.1A4 4 0 017.8 15.1l-.8-.1A4 4 0 015 14z" fill="#fff" />
          </svg>
          &copy; {new Date().getFullYear()} <span className="ml-1 mr-1 text-blue-200 font-semibold">SmartYatri</span> &middot; All rights reserved.
        </div>
        <div className="flex gap-3 sm:gap-6 text-[15px] sm:text-[16px] mt-4 sm:mt-5 md:mt-0">
          <Link to="/Login" className="hover:underline hover:text-blue-300 transition font-medium">Login</Link>
          <Link to="/Signup" className="hover:underline hover:text-blue-300 transition font-medium">Sign Up</Link>
          <a href="mailto:support@smartyatri.app" className="hover:underline hover:text-blue-200 transition font-medium">Support</a>
        </div>
      </footer>

      {/* Local styles */}
      <style>{`
        @media (max-width: 640px) {
          #mobile-menu > nav {
            border-radius: 22px 22px 0 0 !important;
            box-shadow: 0 12px 56px 8px rgba(59,130,246,0.23) !important;
            background: rgba(255,255,255,0.99) !important;
            animation: slideUpMobNav .32s cubic-bezier(.72,.12,.18,1);
          }
        }
        @keyframes slideUpMobNav {
          0% {
            opacity: 0;
            transform: translateY(140px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        /* Hamburger fix on mobile top right */
        header > .md\\:hidden {
          z-index: 90;
        }
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(52px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in-down {
          0% {
            opacity: 0;
            transform: translateY(-32px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.85s cubic-bezier(.4,0,.2,1) both;
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.85s cubic-bezier(.4,0,.2,1) both;
        }
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(38px);
          }
          60% {
            opacity: 1;
            transform: scale(1.08) translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-bounce-in {
          animation: bounce-in 1s cubic-bezier(.4,0,.2,1) 0.2s both;
        }
        @keyframes gradientMove {
          0%,100% {
            background-position: 0% 50%
          }
          50% {
            background-position: 100% 50%
          }
        }
        .animate-gradient {
          background-size: 300% 300%;
          animation: gradientMove 5s ease-in-out infinite;
        }

        /* small helper for desktop nav links */
        .nav-link {
          color: #1e3a8a;
          padding: 0.5rem 0.75rem;
          border-radius: 0.6rem;
          font-weight: 500;
          transition: background-color .18s, color .18s, transform .12s;
        }
        .nav-link:hover,
        .nav-link:focus {
          background: rgba(59,130,246,0.06);
          outline: none;
        }

        html, body {
          scrollbar-color: #6b8bff #eef4ff;
          scrollbar-width: thin;
        }
        ::-webkit-scrollbar {
          width: 9px;
          background: #ecf0fe;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg,#597bfb 0%,#bfd5fd 100%);
          border-radius: 999px;
        }

        .sr-only {
          position: absolute !important;
          height: 1px; width: 1px;
          overflow: hidden;
          clip: rect(1px, 1px, 1px, 1px);
          white-space: nowrap;
        }
        .sr-only.focus:not(.not-sr) {
          position: static;
          height: auto;
          width: auto;
          overflow: visible;
          clip: auto;
        }

        html, body {
          height: 100%;
          max-width: 100vw;
          overflow-x: hidden;
        }
        main {
          min-height: 100vh;
          max-width: 100vw;
          overflow: hidden;
        }

        body {
          overscroll-behavior: contain;
        }
      `}</style>
    </main>
  );
}
