import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white overflow-auto relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,0.8),rgba(0,0,0,1))] opacity-70" />

      <div className="absolute top-20 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-40 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="container relative mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <main className="w-full max-w-4xl mx-auto space-y-8">
          <div className="space-y-4 text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 text-transparent bg-clip-text sm:text-6xl pb-2 tracking-tight">
              Analysis Not Found
            </h1>
            <p className="text-lg text-gray-400 max-w-[600px] mx-auto">
              The analysis results you&apos;re looking for don&apos;t exist or
              haven&apos;t completed yet.
            </p>
            <div className="pt-4">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center px-8 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 hover:from-blue-600 hover:via-cyan-600 hover:to-emerald-600 text-white font-medium rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Go Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
