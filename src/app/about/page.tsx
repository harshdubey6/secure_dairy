import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg-page">
      <header className="flex items-center justify-between px-8 py-6 max-w-4xl mx-auto">
        <Link
          href="/"
          className="font-serif text-xl font-semibold text-text-primary"
        >
          {APP_NAME}
        </Link>
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

      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-serif text-4xl text-text-primary mb-6">
          About {APP_NAME}
        </h1>

        <div className="prose-journal">
          <p>
            {APP_NAME} is a premium personal journal designed for one person:
            you.
          </p>
          <p>
            We believe journaling should feel like a ritual, not a task. The
            interface is deliberately minimal — no notifications, no
            distractions, no gamification. Just you and your thoughts.
          </p>
          <p>
            Built with privacy as a core feature, not an afterthought. Your
            entries belong to you. Always.
          </p>
        </div>
      </main>
    </div>
  );
}
