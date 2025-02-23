
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, AlertTriangle, Lightbulb, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useConversation } from "@11labs/react";
import { useToast } from "@/components/ui/use-toast";

interface QualificationResult {
  score: number;
  summary: string;
  insights: string[];
  recommendations: string[];
}

export function QualificationResults({ results }: { results: QualificationResult }) {
  const [isReading, setIsReading] = useState(false);
  const { toast } = useToast();
  
  // Initialize ElevenLabs conversation
  const conversation = useConversation({
    overrides: {
      tts: {
        voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah's voice
        modelId: "eleven_monolingual_v1"
      }
    }
  });

  useEffect(() => {
    // Initialize ElevenLabs API key
    const apiKey = localStorage.getItem('eleven_labs_key');
    if (apiKey) {
      // Set the correct API key format for ElevenLabs library
      localStorage.setItem('elevenlabs_api_key', apiKey);
    } else {
      toast({
        title: "ElevenLabs API Key Required",
        description: "Please add your ElevenLabs API key in the settings to use text-to-speech.",
        variant: "destructive",
      });
    }
  }, [toast]);

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

  const readResults = async () => {
    try {
      const apiKey = localStorage.getItem('elevenlabs_api_key');
      if (!apiKey) {
        toast({
          title: "API Key Missing",
          description: "Please add your ElevenLabs API key in the settings",
          variant: "destructive",
        });
        return;
      }

      setIsReading(true);
      
      const textToRead = `
        Lead Qualification Score: ${results.score} out of 100.
        ${results.summary}
        
        Key Insights:
        ${results.insights.join(". ")}
        
        Recommendations:
        ${results.recommendations.join(". ")}
      `;

      await conversation.startSession({
        agentId: "text-to-speech",
        text: textToRead,
      });

    } catch (error) {
      console.error('Text-to-speech error:', error);
      toast({
        title: "Error",
        description: "Failed to read results. Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsReading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-6 backdrop-blur-sm bg-white/30 dark:bg-black/30 border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:shadow-lg animate-slideUp">
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-4xl font-bold mb-2">
            <span className={getScoreColor(results.score)}>{results.score}</span>
            <span className="text-gray-400 text-2xl">/100</span>
          </div>
          <Badge className={`${getBadgeVariant(results.score)} px-3 py-1`}>
            {results.score >= 80 ? "High Potential" : results.score >= 60 ? "Medium Potential" : "Low Potential"}
          </Badge>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{results.summary}</p>
          
          <Button
            onClick={readResults}
            variant="outline"
            className="mt-4"
            disabled={isReading}
          >
            {isReading ? (
              <>
                <Volume2 className="mr-2 h-4 w-4 animate-pulse" />
                Reading Results...
              </>
            ) : (
              <>
                <VolumeX className="mr-2 h-4 w-4" />
                Read Results Aloud
              </>
            )}
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="flex items-center text-lg font-semibold mb-2">
              <AlertTriangle className="mr-2 h-5 w-5 text-blue-500" />
              Key Insights
            </h3>
            <ul className="space-y-2">
              {results.insights.map((insight, index) => (
                <li key={index} className="flex items-start">
                  <Check className="mr-2 h-4 w-4 mt-1 text-green-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="flex items-center text-lg font-semibold mb-2">
              <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
              Recommendations
            </h3>
            <ul className="space-y-2">
              {results.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start">
                  <Check className="mr-2 h-4 w-4 mt-1 text-green-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}
