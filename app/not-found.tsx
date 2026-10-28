import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink-950 text-ink-100 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-2xl font-serif uppercase leading-none tracking-tight mb-12">
          ICWT<span className="text-signal">.</span>
        </div>

        <div className="text-7xl text-accent-600 mb-6">404</div>
        <h1 className="text-3xl mb-4">Page Not Found</h1>
        <p className="text-ink-400 mb-10">
          This page doesn't exist or you don't have access.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link href="/dashboard">
            <button className="bg-accent-600 text-ink-950 px-8 py-3 text-sm hover:bg-accent-700 transition-colors">
              Go to Dashboard
            </button>
          </Link>
          <Link href="/">
            <button className="border border-ink-700 text-ink-300 px-8 py-3 text-sm hover:border-accent-600 hover:text-accent-600 transition-colors">
              Go Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
