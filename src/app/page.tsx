import { RepoForm } from "@/components/repo-form";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white overflow-auto">
      <div className="container mx-auto py-8 px-4 sm:px-8">
        <main className="w-full max-w-4xl mx-auto space-y-6">
          <div className="space-y-4 text-center">
            <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text sm:text-5xl pb-2">
              GitHub Repo Analyzer
            </h1>
            <p className="text-gray-400 max-w-[600px] mx-auto">
              Get feedback on your code quality and get suggestions on how to
              improve it
            </p>
          </div>
          <RepoForm />
        </main>
      </div>
    </div>
  );
}
