import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-bg-page flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
      <footer className="pb-6 text-center">
        <Link href="/" className="font-sans text-xs text-text-muted hover:text-text-secondary transition-colors">
          &copy; {new Date().getFullYear()} {APP_NAME}
        </Link>
      </footer>
    </div>
  );
}
