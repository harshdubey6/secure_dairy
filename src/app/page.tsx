import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-page flex flex-col">
      <header className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-serif font-semibold text-text-primary">
            {APP_NAME}
          </span>
        </div>
        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-sans text-text-secondary hover:text-text-primary transition-colors"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="text-sm font-sans bg-accent text-white px-4 py-2 rounded-md hover:bg-accent-hover transition-colors"
          >
            Start Writing
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl">
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-text-primary leading-tight mb-6">
            {APP_TAGLINE}
          </h1>
          <p className="font-body text-xl text-text-secondary leading-relaxed mb-10 max-w-lg mx-auto">
            A calm, secure space for your thoughts. No distractions. No
            notifications. Just you and your journal.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="font-sans text-sm bg-accent text-white px-6 py-3 rounded-md hover:bg-accent-hover transition-colors"
            >
              Start Writing Free
            </Link>
            <Link
              href="/about"
              className="font-sans text-sm text-text-secondary border border-border px-6 py-3 rounded-md hover:border-text-muted transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl">
          {[
            { title: "Offline First", desc: "Write anywhere, sync when connected" },
            { title: "End-to-End Secure", desc: "Your words stay private" },
            { title: "Beautiful Typography", desc: "A joy to read and write" },
            { title: "Distraction-Free", desc: "Nothing but you and your thoughts" },
          ].map((feature) => (
            <div key={feature.title} className="text-left">
              <h3 className="font-serif text-lg text-text-primary mb-1">
                {feature.title}
              </h3>
              <p className="font-sans text-sm text-text-secondary leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-8 text-center">
        <p className="font-sans text-xs text-text-muted">
          &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
