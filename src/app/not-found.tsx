import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl mb-8 text-muted-foreground">Page not found.</p>
      <Link
        href="/"
        className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
