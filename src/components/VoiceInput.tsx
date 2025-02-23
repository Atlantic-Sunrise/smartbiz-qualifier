
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
  const [recognition, setRecognition] = useState<any>(null);
  
  const conversation = useConversation({
    overrides: {
      tts: {
        voiceId: "EXAVITQu4vr4xnSDxMaL" // Sarah's voice
      }
    }
  });

  const stopVoiceInput = () => {
    if (recognition) {
      recognition.stop();
    }
  };

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

    const recognitionInstance = new window.webkitSpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;

    let finalTranscript = '';

    // First, speak the question using ElevenLabs
    conversation.startSession({
      text: questions.challenges
    });

    // Wait for the TTS to finish before starting recognition
    setTimeout(() => {
      recognitionInstance.onstart = () => {
        setIsListening(true);
        console.log("Speech recognition started");
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
        console.log("Speech recognition ended");
        if (finalTranscript) {
          onFieldUpdate(finalTranscript);
        }
      };

      recognitionInstance.onresult = (event: any) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update the input field with the current transcript
        onFieldUpdate(finalTranscript + interimTranscript);
      };

      recognitionInstance.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        recognitionInstance.stop();
      };

      setRecognition(recognitionInstance);
      recognitionInstance.start();
    }, 1000);
  };

  return (
    <Button 
      type="button" 
      onClick={isListening ? stopVoiceInput : startVoiceInput}
      variant="outline"
      className="w-full flex items-center justify-center gap-2"
      disabled={!('webkitSpeechRecognition' in window)}
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
  );
}
