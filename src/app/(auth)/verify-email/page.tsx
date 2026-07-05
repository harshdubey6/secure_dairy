import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="text-center">
      <div className="font-serif text-2xl font-semibold text-text-primary mb-4">
        Verify your email
      </div>
      <p className="font-sans text-sm text-text-secondary mb-8">
        We sent a verification link to your email address.
        <br />
        Please check your inbox and click the link to continue.
      </p>
      <Link
        href="/login"
        className="font-sans text-sm text-accent hover:text-accent-hover"
      >
        Back to login
      </Link>
    </div>
  );
}
