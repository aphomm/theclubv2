import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link href="/">
          <div className="text-2xl font-light tracking-extra-wide mb-12 text-center cursor-pointer hover:text-amber-600 transition-colors">
            <span className="text-stone-100">THE</span>{' '}
            <span className="text-amber-600">CLUB</span>
          </div>
        </Link>
        {children}
      </div>
    </div>
  );
}
