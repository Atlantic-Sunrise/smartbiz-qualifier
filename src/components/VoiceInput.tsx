
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useConversation } from "@11labs/react";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { questions } from "@/constants/businessFormConstants";

interface VoiceInputProps {
  onFieldUpdate: (value: string) => void;
}

export function VoiceInput({ onFieldUpdate }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();
  
  const conversation = useConversation({
    overrides: {
      tts: {
        voiceId: "EXAVITQu4vr4xnSDxMaL" // Sarah's voice
      }
    }
  });

  const startVoiceInput = async () => {
    if (!window.localStorage.getItem('eleven_labs_key')) {
      toast({
        title: "API Key Missing",
        description: "Please add your ElevenLabs API key first",
        variant: "destructive",
      });
      return;
    }

    if (!('webkitSpeechRecognition' in window)) {
      toast({
        title: "Speech Recognition Not Available",
        description: "Your browser doesn't support speech recognition. Please use a Chromium-based browser.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    // First, speak the question using ElevenLabs
    conversation.startSession({
      text: questions.challenges
    });

    // Wait for the TTS to finish before starting recognition
    setTimeout(() => {
      recognition.onstart = () => {
        setIsListening(true);
        console.log("Speech recognition started");
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log("Speech recognition ended");
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onFieldUpdate(transcript);
        console.log(`Recognized text: ${transcript}`);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.start();
    }, 1000);
  };

  return (
    <Button 
      type="button" 
      onClick={startVoiceInput}
      variant="outline"
      className="w-full flex items-center justify-center gap-2"
      disabled={!('webkitSpeechRecognition' in window) || isListening}
    >
      {isListening ? (
        <>
          <Mic className="h-4 w-4 animate-pulse text-red-500" />
          Listening...
        </>
      ) : (
        <>
          <MicOff className="h-4 w-4" />
          Click to Speak Your Business Challenges
        </>
      )}
    </Button>
  );
}
