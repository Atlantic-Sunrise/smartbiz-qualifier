
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useConversation } from "@11labs/react";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { questions } from "@/constants/businessFormConstants";

interface VoiceInputProps {
  onFieldUpdate: (value: string) => void;
}

export function VoiceInput({ onFieldUpdate }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();

  const conversation = useConversation({
    overrides: {
      agent: {
        firstMessage: questions.challenges,
        language: "en",
        parameters: {
          useSpeech: true,
          useTextInput: false
        }
      },
      tts: {
        voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah's voice
        model: "eleven_turbo_v2"
      }
    },
    connectionDelay: {
      android: 3000,
      ios: 1000,
      default: 1000
    },
    preferHeadphonesForIosDevices: true,
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
      if (message.type === 'transcript' && message.transcription) {
        onFieldUpdate(message.transcription);
      }
    },
    onError: (error) => {
      console.error("ElevenLabs error details:", error);
      toast({
        title: "Voice Input Error",
        description: error?.message || "Failed to initialize voice input. Please check your API key and try again.",
        variant: "destructive",
      });
      setIsListening(false);
    }
  });

  useEffect(() => {
    // Verify API key on component mount
    const apiKey = window.localStorage.getItem('eleven_labs_key');
    if (!apiKey) {
      console.log("No ElevenLabs API key found in localStorage");
    } else {
      console.log("ElevenLabs API key found with length:", apiKey.length);
    }
  }, []);

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone permission granted");
      // Stop the stream immediately after permission check
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error("Microphone permission error:", error);
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to use voice input.",
        variant: "destructive",
      });
      return false;
    }
  };

  const startVoiceInput = async () => {
    const apiKey = window.localStorage.getItem('eleven_labs_key');
    if (!apiKey) {
      console.error("ElevenLabs API key not found");
      toast({
        title: "API Key Missing",
        description: "Please add your ElevenLabs API key in the settings",
        variant: "destructive",
      });
      return;
    }

    console.log("Starting voice interaction with key length:", apiKey.length);

    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) return;

    try {
      console.log("Attempting to start session...");
      await conversation.startSession({
        agentId: "default"
      });
      console.log("Session started successfully");
    } catch (error) {
      console.error("Failed to start voice session:", error);
      toast({
        title: "Error",
        description: "Failed to start voice input. Please check your API key and try again.",
        variant: "destructive",
      });
    }
  };

  const stopVoiceInput = async () => {
    try {
      console.log("Ending session...");
      await conversation.endSession();
      console.log("Session ended successfully");
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        type="button" 
        onClick={isListening ? stopVoiceInput : startVoiceInput}
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
      >
        {isListening ? (
          <>
            <Mic className="h-4 w-4 animate-pulse text-red-500" />
            Click When Finished Speaking
          </>
        ) : (
          <>
            <MicOff className="h-4 w-4" />
            Click to Start Speaking
          </>
        )}
      </Button>
    </div>
  );
}
