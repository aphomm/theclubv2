import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ink-950 text-ink-100 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link href="/">
          <div className="text-2xl font-serif uppercase leading-none tracking-tight mb-12 text-center cursor-pointer hover:text-accent-600 transition-colors">
            ICWT<span className="text-signal">.</span>
          </div>
        </Link>
        {children}
      </div>
    </div>
  );
}
