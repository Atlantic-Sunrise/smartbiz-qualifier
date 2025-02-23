
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { useConversation } from "@11labs/react";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";

interface VoiceQualificationDiscussionProps {
  results: {
    score: number;
    summary: string;
    insights: string[];
    recommendations: string[];
  };
}

export function VoiceQualificationDiscussion({ results }: VoiceQualificationDiscussionProps) {
  const [isListening, setIsListening] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [volume, setVolume] = useState(1);
  const { toast } = useToast();

  const conversation = useConversation({
    overrides: {
      agent: {
        firstMessage: `Let's discuss your lead qualification results. Your score is ${results.score} out of 100. ${results.summary}. Would you like to know more about the insights or recommendations?`,
        language: "en",
      },
      tts: {
        voiceId: "EXAVITQu4vr4xnSDxMaL" // Sarah's voice
      }
    },
    onConnect: () => {
      console.log("Connected to ElevenLabs");
      setIsListening(true);
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs");
      setIsListening(false);
    },
    onMessage: (message) => {
      console.log("Received message:", message);
    },
    onError: (error) => {
      console.error("ElevenLabs error:", error);
      toast({
        title: "Error",
        description: "There was an error with the voice interaction. Please try again.",
        variant: "destructive",
      });
      setIsListening(false);
    }
  });

  const requestMicrophonePermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (error) {
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to use voice interaction.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleVolumeChange = async (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    await conversation.setVolume({ volume: newVolume });
  };

  const startVoiceInteraction = async () => {
    if (!window.localStorage.getItem('eleven_labs_key')) {
      toast({
        title: "API Key Missing",
        description: "Please add your ElevenLabs API key first",
        variant: "destructive",
      });
      return;
    }

    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) return;

    try {
      await conversation.startSession({
        agentId: "tHdevlgucdu7DHHmRaUO" // Using your agent ID for qualification discussion
      });
    } catch (error) {
      console.error("Failed to start voice session:", error);
      toast({
        title: "Error",
        description: "Failed to start voice interaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const stopVoiceInteraction = async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        type="button" 
        onClick={isListening ? stopVoiceInteraction : startVoiceInteraction}
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
      >
        {isListening ? (
          <>
            <Mic className="h-4 w-4 animate-pulse text-red-500" />
            Click to End Discussion
          </>
        ) : (
          <>
            <MicOff className="h-4 w-4" />
            Discuss Results with AI
          </>
        )}
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={() => setShowVolumeControl(!showVolumeControl)}
        className="w-full"
      >
        <Volume2 className="h-4 w-4 mr-2" />
        Adjust Volume
      </Button>

      {showVolumeControl && (
        <div className="p-4 border rounded-md">
          <Slider
            value={[volume]}
            min={0}
            max={1}
            step={0.1}
            onValueChange={handleVolumeChange}
          />
        </div>
      )}
    </div>
  );
}
