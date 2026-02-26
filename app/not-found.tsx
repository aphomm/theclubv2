import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-2xl font-light tracking-extra-wide mb-12">
          <span className="text-stone-100">IC</span>
          <span className="text-amber-600">WT</span>
        </div>

        <div className="text-7xl font-light text-amber-600 mb-6">404</div>
        <h1 className="text-3xl font-light mb-4">Page Not Found</h1>
        <p className="text-stone-400 font-light mb-10">
          This page doesn't exist or you don't have access.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link href="/dashboard">
            <button className="bg-amber-600 text-stone-950 px-8 py-3 text-sm font-light hover:bg-amber-700 transition-colors">
              Go to Dashboard
            </button>
          </Link>
          <Link href="/">
            <button className="border border-stone-700 text-stone-300 px-8 py-3 text-sm font-light hover:border-amber-600 hover:text-amber-600 transition-colors">
              Go Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
