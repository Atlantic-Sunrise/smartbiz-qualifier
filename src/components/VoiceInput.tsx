
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useConversation } from "@11labs/react";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { BusinessFormData, questions } from "@/constants/businessFormConstants";

interface VoiceInputProps {
  onFieldUpdate: (field: keyof BusinessFormData, value: string) => void;
}

export function VoiceInput({ onFieldUpdate }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [currentField, setCurrentField] = useState<keyof BusinessFormData | null>(null);
  const { toast } = useToast();
  
  const conversation = useConversation({
    overrides: {
      tts: {
        voiceId: "EXAVITQu4vr4xnSDxMaL"
      }
    }
  });

  const askQuestion = async (question: string, field: keyof BusinessFormData) => {
    return new Promise<void>((resolve) => {
      if (!('webkitSpeechRecognition' in window)) {
        resolve();
        return;
      }

      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      conversation.startSession({
        text: question
      });

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
        resolve();
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onFieldUpdate(field, transcript);
      };

      recognition.start();
    });
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

    if (!('webkitSpeechRecognition' in window)) {
      toast({
        title: "Speech Recognition Not Available",
        description: "Your browser doesn't support speech recognition. Please use a Chromium-based browser.",
        variant: "destructive",
      });
      return;
    }

    const fields: (keyof BusinessFormData)[] = ['companyName', 'industry', 'employeeCount', 'annualRevenue', 'website', 'challenges'];
    
    for (const field of fields) {
      setCurrentField(field);
      await askQuestion(questions[field], field);
    }

    setCurrentField(null);
  };

  return (
    <div className="mb-6">
      <Button 
        type="button" 
        onClick={startVoiceInteraction}
        className="w-full mb-4"
        variant="outline"
        disabled={!('webkitSpeechRecognition' in window)}
      >
        {isListening ? (
          <>
            <Mic className="w-4 h-4 mr-2 animate-pulse text-red-500" />
            Listening...
          </>
        ) : (
          <>
            <MicOff className="w-4 h-4 mr-2" />
            Start Voice Interview
          </>
        )}
      </Button>
      {currentField && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Currently asking about: {currentField}
        </div>
      )}
    </div>
  );
}
