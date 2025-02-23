
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
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
        <Link to="/discuss" state={{ results }} className="w-full block">
          <Button 
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Discuss Results with AI Assistant
          </Button>
        </Link>
      </Card>
    </div>
  );
}
