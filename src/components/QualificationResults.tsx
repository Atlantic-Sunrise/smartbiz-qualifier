
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useConversation } from "@11labs/react";
import { useToast } from "@/components/ui/use-toast";
import { ScoreDisplay } from "./qualification-results/ScoreDisplay";
import { InsightsList } from "./qualification-results/InsightsList";
import { RecommendationsList } from "./qualification-results/RecommendationsList";
import { ConversationButton } from "./qualification-results/ConversationButton";
import { useElevenLabsKey } from "@/hooks/useElevenLabsKey";

interface QualificationResult {
  score: number;
  summary: string;
  insights: string[];
  recommendations: string[];
}

export function QualificationResults({ results }: { results: QualificationResult }) {
  const [isConversing, setIsConversing] = useState(false);
  const apiKey = useElevenLabsKey();
  const { toast } = useToast();
  
  const conversation = useConversation({
    overrides: {
      agent: {
        prompt: {
          prompt: `You are an AI business analyst assistant. You have analyzed a business lead with the following results:
          Score: ${results.score}/100
          Summary: ${results.summary}
          Key Insights: ${results.insights.join(". ")}
          Recommendations: ${results.recommendations.join(". ")}
          
          Help the user understand these results and provide additional insights based on their questions.
          Be concise but informative in your responses.`
        },
        firstMessage: "I've analyzed your lead qualification results. Would you like me to explain any specific aspect of the analysis?",
      },
      tts: {
        voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah's voice
        modelId: "eleven_monolingual_v1",
        apiKey: apiKey || '',
      },
    },
    onMessage: (message) => {
      console.log('Received message:', message);
    },
    onError: (error) => {
      console.error('Conversation error:', error);
      toast({
        title: "Error",
        description: `Conversation error: ${error.message}`,
        variant: "destructive",
      });
      setIsConversing(false);
    }
  });

  const handleConversationToggle = async () => {
    if (isConversing) {
      await stopConversation();
    } else {
      await startConversation();
    }
  };

  const startConversation = async () => {
    try {
      if (!apiKey) {
        toast({
          title: "API Key Missing",
          description: "Please add your ElevenLabs API key in the settings",
          variant: "destructive",
        });
        return;
      }

      console.log('Starting conversation with API key present');
      setIsConversing(true);
      await conversation.startSession({});
    } catch (error) {
      console.error('Conversation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start conversation",
        variant: "destructive",
      });
      setIsConversing(false);
    }
  };

  const stopConversation = async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error('Error ending conversation:', error);
    } finally {
      setIsConversing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-6 backdrop-blur-sm bg-white/30 dark:bg-black/30 border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:shadow-lg animate-slideUp">
      <div className="space-y-6">
        <ScoreDisplay score={results.score} summary={results.summary} />
        <ConversationButton isConversing={isConversing} onClick={handleConversationToggle} />
        <div className="space-y-4">
          <InsightsList insights={results.insights} />
          <RecommendationsList recommendations={results.recommendations} />
        </div>
      </div>
    </Card>
  );
}
