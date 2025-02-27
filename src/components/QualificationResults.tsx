
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ScoreDisplay } from "./qualification-results/ScoreDisplay";
import { InsightsList } from "./qualification-results/InsightsList";
import { RecommendationsList } from "./qualification-results/RecommendationsList";
import { VoiceInput } from "./VoiceInput";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Send } from "lucide-react";

interface QualificationResultsProps {
  results: {
    score: number;
    summary: string;
    insights: string[];
    recommendations: string[];
  };
}

export function QualificationResults({ results }: QualificationResultsProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) return;
    
    setIsLoading(true);
    try {
      // Create context from results
      const context = `
        Score: ${results.score}/100
        Summary: ${results.summary}
        Insights: ${results.insights.join(", ")}
        Recommendations: ${results.recommendations.join(", ")}
      `;
      
      // Simulate AI response based on context and question
      // In a real app, you would call an API here
      const simulatedResponse = await new Promise<string>((resolve) => {
        setTimeout(() => {
          const responses = [
            `Based on the lead's score of ${results.score}, I would recommend focusing on ${results.recommendations[0].toLowerCase()}`,
            `The key insight to consider is that ${results.insights[0].toLowerCase()}`,
            `Given the summary, I would suggest prioritizing outreach to this lead based on their ${results.score > 70 ? "high potential" : "specific needs"}`,
            `This lead's qualification score of ${results.score}/100 indicates ${results.score > 80 ? "strong" : results.score > 60 ? "moderate" : "limited"} potential for conversion`
          ];
          resolve(responses[Math.floor(Math.random() * responses.length)]);
        }, 1000);
      });
      
      setAnswer(simulatedResponse);
    } catch (error) {
      console.error("Error generating answer:", error);
      setAnswer("Sorry, I couldn't process your question. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = (transcript: string) => {
    setQuestion(transcript);
  };

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
        <h3 className="text-lg font-semibold mb-4">Ask a Question About Results</h3>
        <form onSubmit={handleQuestionSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">Your Question</Label>
            <div className="flex gap-2">
              <Input
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about this lead qualification..."
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !question.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <VoiceInput onFieldUpdate={handleVoiceInput} />
          
          {answer && (
            <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-md">
              <h4 className="font-medium mb-2">Answer:</h4>
              <p className="text-gray-700 dark:text-gray-300">{answer}</p>
            </div>
          )}
          
          {isLoading && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md animate-pulse">
              <p className="text-gray-500 dark:text-gray-400">Generating answer...</p>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
