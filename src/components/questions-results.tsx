import { GitHubLogoIcon } from "@radix-ui/react-icons";
interface QuestionsResultsProps {
  questions: string[];
  repositoryUrl: string;
  generatedAt: string;
}

export function QuestionsResults({
  questions,
  repositoryUrl,
  generatedAt,
}: QuestionsResultsProps) {
  return (
    <div className="backdrop-blur-xl bg-gradient-to-b from-white/[0.07] to-transparent rounded-2xl border border-white/[0.1] shadow-[0_0_1px_1px_rgba(0,0,0,0.3)]">
      <div className="p-8 space-y-6">
        <div className="p-4 bg-black/20 border border-white/10 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <GitHubLogoIcon className="w-5 h-5 text-gray-400" />
            <a
              href={repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
            >
              {repositoryUrl}
            </a>
          </div>
          <p className="text-gray-400 text-sm">
            Generated on {new Date(generatedAt).toLocaleString()}
          </p>
        </div>

        <div className="space-y-4">
          {questions.map((question, index) => (
            <div
              key={index}
              className="p-4 bg-black/30 border border-white/10 rounded-xl"
            >
              <p className="text-white">{question}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
