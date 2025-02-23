
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ScoreDisplay } from "./qualification-results/ScoreDisplay";
import { InsightsList } from "./qualification-results/InsightsList";
import { RecommendationsList } from "./qualification-results/RecommendationsList";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface QualificationResult {
  score: number;
  summary: string;
  insights: string[];
  recommendations: string[];
}

export function QualificationResults({ results }: { results: QualificationResult }) {
  const [isShowingDetails, setIsShowingDetails] = useState(false);
  const { toast } = useToast();

  const toggleDetails = () => {
    setIsShowingDetails(!isShowingDetails);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-6 backdrop-blur-sm bg-white/30 dark:bg-black/30 border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:shadow-lg animate-slideUp">
      <div className="space-y-6">
        <ScoreDisplay score={results.score} summary={results.summary} />
        <Button 
          onClick={toggleDetails} 
          variant="outline"
          className="w-full"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          {isShowingDetails ? "Hide Details" : "Show Details"}
        </Button>
        {isShowingDetails && (
          <div className="space-y-4 animate-fadeIn">
            <InsightsList insights={results.insights} />
            <RecommendationsList recommendations={results.recommendations} />
          </div>
        )}
      </div>
    </Card>
  );
}
