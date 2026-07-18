import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { Book, Lock, PenLine, CloudOff, Sparkles } from "lucide-react";

const features = [
  {
    icon: PenLine,
    title: "Beautiful Writing",
    desc: "A distraction-free editor with rich typography and a warm, paper-like feel.",
  },
  {
    icon: Lock,
    title: "End-to-End Secure",
    desc: "Your words stay private with encryption. Even we can't read them.",
  },
  {
    icon: CloudOff,
    title: "Offline First",
    desc: "Write anywhere, anytime. Syncs seamlessly when you're back online.",
  },
  {
    icon: Sparkles,
    title: "Daily Prompts",
    desc: "Never face a blank page. Gentle prompts to get you started.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-bg-page flex flex-col">
      <header className="flex items-center justify-between px-6 sm:px-8 py-5 max-w-6xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl font-serif font-semibold text-text-primary group-hover:text-accent transition-colors">
            {APP_NAME}
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="font-sans text-sm text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-md transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="font-sans text-sm bg-accent text-white px-4 py-1.5 rounded-md hover:bg-accent-hover transition-all hover:shadow-lg"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col">
        <section className="px-6 pt-20 pb-16 sm:pt-28 sm:pb-20 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-b from-accent-muted/20 to-transparent pointer-events-none" />
          <div className="max-w-3xl mx-auto relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-muted/50 border border-accent-muted text-accent text-xs font-sans font-medium mb-6">
              <Sparkles className="w-3 h-3" />
              Your private space to think
            </div>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-text-primary leading-[1.1] tracking-tight mb-6">
              {APP_TAGLINE}
            </h1>
            <p className="font-body text-lg sm:text-xl text-text-secondary leading-relaxed max-w-lg mx-auto mb-10">
              A calm, secure home for your thoughts. No ads, no notifications, no distractions — just you and the page.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/signup"
                className="font-sans text-sm bg-accent text-white px-7 py-3 rounded-lg hover:bg-accent-hover transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                Start Writing Free
              </Link>
              <Link
                href="/login"
                className="font-sans text-sm text-text-secondary border border-border px-7 py-3 rounded-lg hover:border-text-muted hover:text-text-primary transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24 max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="p-6 rounded-xl bg-bg-surface border border-border-light hover:border-accent/30 transition-all hover:shadow-lg group"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent-muted/50 flex items-center justify-center mb-4 group-hover:bg-accent-muted transition-colors">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-serif text-lg text-text-primary mb-1.5">{feature.title}</h3>
                  <p className="font-sans text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="px-6 pb-24 max-w-3xl mx-auto w-full text-center">
          <div className="rounded-2xl bg-bg-surface border border-border-light p-8 sm:p-12">
            <Book className="w-10 h-10 text-accent mx-auto mb-4" />
            <h2 className="font-serif text-2xl sm:text-3xl text-text-primary mb-3">
              Start your journal today
            </h2>
            <p className="font-body text-text-secondary mb-6 max-w-sm mx-auto">
              Thousands of thoughts are waiting to be written. Your first entry is just a click away.
            </p>
            <Link
              href="/signup"
              className="inline-flex font-sans text-sm bg-accent text-white px-6 py-2.5 rounded-lg hover:bg-accent-hover transition-all hover:shadow-lg"
            >
              Begin Writing
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-border-light">
        <p className="font-sans text-xs text-text-muted text-center">
          &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
