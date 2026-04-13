import Link from 'next/link';
import { CalendarDays, CheckSquare, Heart, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f2a3f 0%, #0f4c5c 40%, #1a6b5a 100%)' }}
      >
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #fbbf24, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #2dd4bf, transparent)' }} />

        {/* Brand bar */}
        <div className="relative z-10 mb-8 flex items-center gap-3 justify-center">
          <img src="/logo.svg" alt="Daily Rhythm" className="h-14 w-auto object-contain drop-shadow-lg" />
          <span className="text-white/50 text-xl font-light">|</span>
          <span className="text-white/80 text-sm font-bold tracking-[0.3em] uppercase">Daily Rhythm</span>
        </div>

        {/* Headline */}
        <h1 className="relative z-10 text-5xl sm:text-6xl md:text-7xl font-extrabold text-white leading-tight mb-5 max-w-4xl">
          Live each day<br />
          <span style={{
            background: 'linear-gradient(90deg, #fbbf24, #f97316)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            with intention.
          </span>
        </h1>

        {/* Sub */}
        <p className="relative z-10 text-lg sm:text-xl text-white/65 max-w-xl mb-10 leading-relaxed">
          A personal daily planner, habit tracker, and reminder app — designed to help you build routines, grow in faith, and thrive in every area of life.
        </p>

        {/* CTAs */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="px-8 py-4 rounded-2xl text-base font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 rounded-2xl text-base font-semibold text-white/90 border border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all hover:scale-105"
          >
            Sign In
          </Link>
        </div>

        <p className="relative z-10 mt-8 text-white/35 text-xs tracking-wider flex items-center gap-2 justify-center">
          <Heart className="h-3.5 w-3.5 text-amber-400" />
          Designed to help you show up fully — every single day
        </p>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80 C360 20 1080 20 1440 80 L1440 80 L0 80 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold tracking-widest text-teal-600 uppercase mb-3">What it does</span>
            <h2 className="text-4xl font-extrabold text-gray-900">Everything you need, in one place</h2>
            <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto">
              Stop scattered sticky notes and forgotten habits. Daily Rhythm keeps your routines, goals, and reminders organized so you can focus on what matters most.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <CalendarDays className="h-7 w-7" />,
                gradient: 'from-teal-500 to-cyan-500',
                bg: 'bg-teal-50',
                title: 'Daily Scheduler',
                desc: 'Build structured daily routines with activities, time slots, and sub-tasks. Set recurring defaults so every morning auto-populates with your schedule.',
              },
              {
                icon: <CheckSquare className="h-7 w-7" />,
                gradient: 'from-amber-500 to-orange-400',
                bg: 'bg-amber-50',
                title: 'Habit Tracker',
                desc: 'Track daily habits across faith, health, relationships, home, and more. Check off habits each day and watch your streaks grow.',
              },
              {
                icon: <BookOpen className="h-7 w-7" />,
                gradient: 'from-indigo-500 to-blue-500',
                bg: 'bg-indigo-50',
                title: 'Reminders & Tasks',
                desc: 'A clean, Apple Reminders-style to-do list for everything on your mind — groceries, appointments, prayer requests, and more.',
              },
            ].map(f => (
              <div key={f.title} className={`${f.bg} rounded-3xl p-8 flex flex-col gap-4`}>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-white shadow-md`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{f.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="bg-gray-50 py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-xs font-bold tracking-widest text-teal-600 uppercase mb-3">Simple by design</span>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-16">Up and running in minutes</h2>
          <div className="space-y-6 text-left">
            {[
              { step: '01', title: 'Build your daily schedule', desc: 'Add your recurring activities — morning routines, workouts, family dinner, Bible study — and assign time slots. Your schedule auto-populates every day.' },
              { step: '02', title: 'Set your habits', desc: 'Choose habits that matter to you — prayer, exercise, water, reading, gratitude. Check them off each day and build consistency one day at a time.' },
              { step: '03', title: 'Capture everything else', desc: 'Use the Reminders list to capture tasks, errands, and anything you don\'t want to forget. It\'s always there, always simple.' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <span className="text-5xl font-black text-teal-100 leading-none select-none flex-shrink-0 mt-1">{s.step}</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature checklist ────────────────────────────────── */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-xs font-bold tracking-widest text-teal-600 uppercase mb-3">Built for real life</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Everything that helps you thrive</h2>
            <ul className="space-y-3">
              {[
                'Auto-populated daily schedules from your recurring defaults',
                'Habit categories: Faith, Health, Relationships, Home, Finance & more',
                'Comprehensive household task library — daily, weekly, monthly, seasonal',
                'Apple Reminders-style to-do list with completed section',
                'AI-powered schedule assistant and plan generator',
                'Week-at-a-glance view for planning ahead',
                'Print or export any day or week',
                'Dark mode · Installable on any phone (PWA)',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-gray-700 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-teal-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Mock card */}
          <div className="relative">
            <div
              className="rounded-3xl overflow-hidden shadow-2xl border border-gray-200"
              style={{ background: 'linear-gradient(135deg, #0f2a3f 0%, #0f4c5c 100%)' }}
            >
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-teal-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-orange-400" />
                  <span className="ml-2 text-white/40 text-xs font-mono">Monday — Today</span>
                </div>
                {[
                  { time: '6:30 AM', name: 'Morning Prayer & Devotional', done: true, color: '#a855f7' },
                  { time: '7:00 AM', name: 'Exercise — 30 min walk', done: true, color: '#22c55e' },
                  { time: '8:00 AM', name: 'Family Breakfast Together', done: false, color: '#f59e0b' },
                  { time: '9:00 AM', name: 'Work Focus Block', done: false, color: '#3b82f6' },
                  { time: '6:00 PM', name: 'Family Dinner & Devotional', done: false, color: '#2dd4bf' },
                ].map(a => (
                  <div key={a.time} className="flex items-center gap-3 mb-3 last:mb-0">
                    <span className="text-white/35 text-xs font-mono w-16 flex-shrink-0">{a.time}</span>
                    <div
                      className={`flex-1 rounded-xl px-3 py-2 flex items-center gap-2 ${a.done ? 'opacity-45' : 'opacity-100'}`}
                      style={{ backgroundColor: `${a.color}22`, borderLeft: `3px solid ${a.color}` }}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${a.done ? 'border-green-400 bg-green-400' : 'border-white/25'}`}>
                        {a.done && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs font-medium ${a.done ? 'text-white/35 line-through' : 'text-white/85'}`}>
                        {a.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Sparkles className="absolute -top-4 -right-4 h-8 w-8 text-amber-400 opacity-80" />
            <Sparkles className="absolute -bottom-3 -left-3 h-6 w-6 text-teal-400 opacity-60" />
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────── */}
      <section
        className="py-24 px-6 text-center text-white"
        style={{ background: 'linear-gradient(135deg, #0f4c5c 0%, #1a6b5a 100%)' }}
      >
        <h2 className="text-4xl font-extrabold mb-4">Ready to find your rhythm?</h2>
        <p className="text-white/65 text-lg mb-10 max-w-xl mx-auto">
          Join people building better routines and living with more purpose — one day at a time.
        </p>
        <Link
          href="/signup"
          className="inline-block px-10 py-4 rounded-2xl text-base font-bold shadow-xl hover:scale-105 transition-transform"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: 'white' }}
        >
          Create Your Free Account
        </Link>
        <p className="mt-4 text-white/35 text-xs">No credit card required · Takes less than a minute</p>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="bg-gray-900 py-8 px-6 text-center text-gray-600 text-xs">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="/logo.svg" alt="" className="h-6 w-auto opacity-50" />
          <span className="text-gray-400 font-semibold">Daily Rhythm</span>
        </div>
        <p className="text-gray-600">Built to help you live each day with intention and grace.</p>
        <div className="flex justify-center gap-6 mt-3">
          <Link href="/login" className="hover:text-gray-400 transition-colors">Sign In</Link>
          <Link href="/signup" className="hover:text-gray-400 transition-colors">Sign Up</Link>
        </div>
      </footer>
    </div>
  );
}
