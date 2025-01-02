import { RepoForm } from "@/components/repo-form";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-8 text-center">
          GitHub Repo Analyzer
        </h1>
        <RepoForm />
      </main>
    </div>
  );
}
