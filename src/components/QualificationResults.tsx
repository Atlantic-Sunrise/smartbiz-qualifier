
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, AlertTriangle, Lightbulb, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConversation } from "@11labs/react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface QualificationResult {
  score: number;
  summary: string;
  insights: string[];
  recommendations: string[];
}

export function QualificationResults({ results }: { results: QualificationResult }) {
  const [isConversing, setIsConversing] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
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
        voiceId: "21m00Tcm4TlvDq8ikWAM",
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

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        // First try to get from localStorage
        const storedKey = localStorage.getItem('eleven_labs_key');
        if (storedKey) {
          console.log('Found API key in localStorage');
          setApiKey(storedKey);
          return;
        }

        // If not in localStorage, try to get from Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('No user found');
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('api_keys')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching API key:', error);
          return;
        }
        
        if (data?.api_keys?.eleven_labs_key) {
          console.log('Setting API key from Supabase');
          const newKey = data.api_keys.eleven_labs_key;
          localStorage.setItem('eleven_labs_key', newKey);
          setApiKey(newKey);
        } else {
          console.log('No API key found in profile');
        }
      } catch (error) {
        console.error('Error checking API key:', error);
      }
    };

    checkApiKey();
  }, []);

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
      
      await conversation.startSession({
        agentId: "tHdevlgucdu7DHHmRaUO",
      });

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
            onClick={isConversing ? stopConversation : startConversation}
            variant="outline"
            className="mt-4"
          >
            {isConversing ? (
              <>
                <Mic className="mr-2 h-4 w-4 animate-pulse text-red-500" />
                Stop Conversation
              </>
            ) : (
              <>
                <MicOff className="mr-2 h-4 w-4" />
                Discuss Results with AI
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
