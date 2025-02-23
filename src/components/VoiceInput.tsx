
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
        voiceId: "EXAVITQu4vr4xnSDxMaL" // Sarah's voice
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

      // First, speak the question using ElevenLabs
      conversation.startSession({
        text: `${question} You can speak your answer, type it in the field, or use the dropdown if available. Please speak now.`
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
          resolve();
        };

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          onFieldUpdate(field, transcript);
          console.log(`Recognized text: ${transcript}`);
        };

        recognition.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          resolve();
        };

        // Start listening after a short delay to ensure the TTS has finished
        recognition.start();
      }, 1000); // Adjust this delay based on the length of the TTS message
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

    // Initial greeting
    conversation.startSession({
      text: "Hello! I'll help you fill out this form. I'll ask you questions one by one, and you can either speak your answers, type them in, or use the dropdown menus where available. Let's begin!"
    });

    // Wait for the greeting to finish
    await new Promise(resolve => setTimeout(resolve, 4000));

    const fields: (keyof BusinessFormData)[] = ['companyName', 'industry', 'employeeCount', 'annualRevenue', 'website', 'challenges'];
    
    for (const field of fields) {
      setCurrentField(field);
      await askQuestion(questions[field], field);
      // Add a pause between questions
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Final message
    conversation.startSession({
      text: "Thank you for providing all the information. The form is now complete!"
    });

    setCurrentField(null);
  };

  return (
    <div className="mb-6">
      <Button 
        type="button" 
        onClick={startVoiceInteraction}
        className="w-full mb-4"
        variant="outline"
        disabled={!('webkitSpeechRecognition' in window) || isListening}
      >
        {isListening ? (
          <>
            <Mic className="w-4 h-4 mr-2 animate-pulse text-red-500" />
            Listening...
          </>
        ) : (
          <>
            {currentField ? <Mic className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2" />}
            {currentField ? "Speaking..." : "Start Voice Interview"}
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
