
import { Badge } from "@/components/ui/badge";

interface ScoreDisplayProps {
  score: number;
  summary: string;
}

export function ScoreDisplay({ score, summary }: ScoreDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getBadgeVariant = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="text-center">
      <div className="text-4xl font-bold mb-2">
        <span className={getScoreColor(score)}>{score}</span>
        <span className="text-gray-400 text-2xl">/100</span>
      </div>
      <Badge className={`${getBadgeVariant(score)} px-3 py-1`}>
        {score >= 80 ? "High Potential" : score >= 60 ? "Medium Potential" : "Low Potential"}
      </Badge>
      <p className="mt-4 text-gray-600 dark:text-gray-300">{summary}</p>
    </div>
  );
}
