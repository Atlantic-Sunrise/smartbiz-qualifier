
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ScoreDisplay } from "./qualification-results/ScoreDisplay";
import { InsightsList } from "./qualification-results/InsightsList";
import { RecommendationsList } from "./qualification-results/RecommendationsList";
import { VoiceInput } from "./VoiceInput";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Send, Mail } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { sendQualificationSummary } from "@/services/emailService";
import { supabase } from "@/integrations/supabase/client";

interface QualificationResultsProps {
  results: {
    score: number;
    summary: string;
    insights: string[];
    recommendations: string[];
  };
  businessName?: string;
}

export function QualificationResults({ results, businessName = "" }: QualificationResultsProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const { toast } = useToast();

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
      
      // Call the Supabase edge function instead of using client-side API key
      const { data, error } = await supabase.functions.invoke('answer-question', {
        body: {
          question: question,
          context: context
        }
      });

      if (error) {
        throw new Error("Failed to generate answer. Please try again.");
      }
      
      setAnswer(data.answer);
    } catch (error) {
      console.error("Error generating answer:", error);
      setAnswer("Sorry, I couldn't process your question. Please try again later.");
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate an answer",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = (transcript: string) => {
    setQuestion(transcript);
  };
  
  // Determine the primary challenge based on the qualification data
  const extractKeyNeed = (): string => {
    // Common business need categories
    const needKeywords: Record<string, string[]> = {
      "growth": ["growth", "scale", "expand", "acquisition", "customer", "revenue", "sales", "market share"],
      "marketing": ["marketing", "branding", "advertising", "visibility", "promotion", "awareness"],
      "finance": ["finance", "funding", "cash flow", "investment", "budget", "cost", "profit", "pricing"],
      "operations": ["operations", "efficiency", "process", "workflow", "productivity", "logistics"],
      "talent": ["talent", "hiring", "recruitment", "staff", "employee", "retention", "team", "workforce"],
      "technology": ["technology", "digital", "software", "automation", "integration", "infrastructure", "IT"],
      "competition": ["competition", "competitive", "market", "industry", "disruption"],
      "innovation": ["innovation", "product", "development", "R&D", "creative", "design"],
      "compliance": ["compliance", "regulation", "legal", "policy", "standard"],
      "strategy": ["strategy", "planning", "direction", "vision", "mission", "pivot"]
    };

    // Combine summary and insights into a single text to analyze
    const text = results.summary + " " + results.insights.join(" ") + " " + results.recommendations.join(" ");
    const lowerText = text.toLowerCase();
    
    // Find which category has the most keyword matches
    let bestCategory = "growth"; // Default
    let highestMatches = 0;
    
    for (const [category, keywords] of Object.entries(needKeywords)) {
      const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
      if (matches > highestMatches) {
        highestMatches = matches;
        bestCategory = category;
      }
    }
    
    return bestCategory.charAt(0).toUpperCase() + bestCategory.slice(1);
  };

  const handleSendSummary = async () => {
    try {
      setIsSendingEmail(true);
      
      // Get current user's email
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !user.email) {
        throw new Error("User email not found. Please ensure you're logged in.");
      }
      
      // Get the key need
      const keyNeed = extractKeyNeed();
      
      // Send the email
      const response = await sendQualificationSummary({
        email: user.email,
        businessName: businessName,
        score: results.score,
        summary: results.summary,
        insights: results.insights,
        recommendations: results.recommendations,
        keyNeed: keyNeed
      });
      
      toast({
        title: "Summary Sent",
        description: `Qualification summary has been sent to ${user.email}`,
      });
    } catch (error) {
      console.error("Error sending summary:", error);
      toast({
        title: "Email Failed",
        description: error instanceof Error ? error.message : "Failed to send summary email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Extract key need once for the component
  const keyNeed = extractKeyNeed();

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <div className="flex flex-col space-y-4">
          <ScoreDisplay score={results.score} summary={results.summary} />
          
          <div className="mt-6 flex justify-center">
            <Button 
              onClick={handleSendSummary}
              disabled={isSendingEmail}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-2 text-base"
              size="lg"
            >
              <Mail className="mr-2 h-5 w-5" />
              {isSendingEmail ? "Sending..." : "Email Qualification Summary"}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <InsightsList insights={results.insights} />
        <RecommendationsList recommendations={results.recommendations} keyNeed={keyNeed} />
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
            <p className="text-sm text-gray-500 mt-1 mb-2">Type in the field above or use voice input:</p>
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
