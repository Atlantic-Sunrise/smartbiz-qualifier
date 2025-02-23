
import { VoiceQualificationDiscussion } from "./VoiceQualificationDiscussion";
import { Card } from "@/components/ui/card";
import { ScoreDisplay } from "./qualification-results/ScoreDisplay";
import { InsightsList } from "./qualification-results/InsightsList";
import { RecommendationsList } from "./qualification-results/RecommendationsList";

interface QualificationResultsProps {
  results: {
    score: number;
    summary: string;
    insights: string[];
    recommendations: string[];
  };
}

export function QualificationResults({ results }: QualificationResultsProps) {
  return (
    <div className="space-y-8">
      <Card className="p-6">
        <ScoreDisplay score={results.score} summary={results.summary} />
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <InsightsList insights={results.insights} />
        <RecommendationsList recommendations={results.recommendations} />
      </div>

      <Card className="p-6">
        <VoiceQualificationDiscussion results={results} />
      </Card>
    </div>
  );
}
