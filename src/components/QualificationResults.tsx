
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
import { GoogleGenerativeAI } from "@google/generative-ai";
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
      const apiKey = localStorage.getItem('gemini_api_key');
      if (!apiKey) {
        throw new Error("Gemini API key not found. Please add your API key in the settings.");
      }
      
      // Create context from results
      const context = `
        Score: ${results.score}/100
        Summary: ${results.summary}
        Insights: ${results.insights.join(", ")}
        Recommendations: ${results.recommendations.join(", ")}
      `;
      
      // Initialize the Gemini API
      const genAI = new GoogleGenerativeAI(apiKey);
      // Updated to use the current model name
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Create the prompt that includes both context and user question
      const prompt = `
        You are a business lead qualification expert. I'm going to provide you with information 
        about a qualified business lead and then ask you a question about it.
        
        Here is the lead qualification information:
        ${context}
        
        Based on this information, please answer the following question:
        ${question}
        
        Provide a concise, professional response focused on actionable insights. Limit your 
        response to 3-4 sentences.
      `;
      
      // Generate content
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const generatedText = response.text();
      
      setAnswer(generatedText);
    } catch (error) {
      console.error("Error generating answer:", error);
      
      // Provide a more user-friendly error message
      const errorMessage = error instanceof Error ? error.message : "Please try again.";
      const isApiVersionError = errorMessage.includes("models/gemini-pro is not found") || 
                               errorMessage.includes("not supported for generateContent");
      
      if (isApiVersionError) {
        toast({
          title: "API Error",
          description: "The Gemini model is outdated or unavailable. Please update your API key to use the latest version.",
          variant: "destructive",
        });
        setAnswer("Sorry, there's an issue with the Gemini API. The model might be outdated or unavailable. Please update your API key or try again later.");
      } else {
        setAnswer(`Sorry, I couldn't process your question. ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = (transcript: string) => {
    setQuestion(transcript);
  };

  const handleSendSummary = async () => {
    try {
      setIsSendingEmail(true);
      
      // Get current user's email
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !user.email) {
        throw new Error("User email not found. Please ensure you're logged in.");
      }
      
      // Send the email
      await sendQualificationSummary({
        email: user.email,
        businessName: businessName,
        score: results.score,
        summary: results.summary,
        insights: results.insights,
        recommendations: results.recommendations
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

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <div className="flex flex-col space-y-4">
          <ScoreDisplay score={results.score} summary={results.summary} />
          
          <div className="mt-4 flex justify-center">
            <Button 
              onClick={handleSendSummary}
              disabled={isSendingEmail}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Mail className="mr-2 h-4 w-4" />
              {isSendingEmail ? "Sending..." : "Email Summary"}
            </Button>
          </div>
        </div>
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
