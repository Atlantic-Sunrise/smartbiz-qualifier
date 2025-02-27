
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

interface VoiceInputProps {
  onFieldUpdate: (value: string) => void;
}

export function VoiceInput({ onFieldUpdate }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();
  
  const startListening = async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const recognition = new (window.webkitSpeechRecognition)();
      recognition.continuous = false; // Only listen once
      recognition.interimResults = false; // Only get final results
      
      recognition.onstart = () => {
        console.log("Started listening");
        setIsListening(true);
      };

      recognition.onend = () => {
        console.log("Stopped listening");
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("Final transcript:", transcript);
        onFieldUpdate(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        toast({
          title: "Error",
          description: "There was an error with the voice input. Please try again.",
          variant: "destructive",
        });
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      console.error("Microphone access error:", error);
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to use voice input.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        type="button" 
        onClick={startListening}
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
        disabled={isListening}
      >
        {isListening ? (
          <>
            <Mic className="h-4 w-4 animate-pulse text-red-500" />
            Listening...
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            Click Here to Speak
          </>
        )}
      </Button>
    </div>
  );
}
