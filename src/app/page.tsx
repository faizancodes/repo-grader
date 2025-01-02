import { RepoForm } from "@/components/repo-form";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
        <main className="w-full max-w-lg space-y-6">
          <div className="space-y-4 text-center">
            <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text sm:text-5xl pb-2">
              GitHub Repo Analyzer
            </h1>
            <p className="text-gray-400 max-w-[600px] mx-auto">
              Analyze any GitHub repository instantly. Get insights about code
              structure, dependencies, and more.
            </p>
          </div>
          <RepoForm />
        </main>
      </div>
    </div>
  );
}
