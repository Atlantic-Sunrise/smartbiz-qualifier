
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useState, useRef, useEffect } from "react";

interface VoiceInputProps {
  onFieldUpdate: (value: string) => void;
}

export function VoiceInput({ onFieldUpdate }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // Initialize recognition instance once
    recognitionRef.current = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
    const recognition = recognitionRef.current;
    
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      console.log("Started listening");
      setIsListening(true);
    };

    recognition.onend = () => {
      console.log("Stopped listening");
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join(" ");
      
      if (event.results[0].isFinal) {
        console.log("Final transcript:", transcript);
        onFieldUpdate(transcript);
      }
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

    // Cleanup on unmount
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [onFieldUpdate, toast]);

  const requestMicrophonePermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (error) {
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to use voice input.",
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleListening = async () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) return;
      
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Failed to start voice recognition:", error);
        toast({
          title: "Error",
          description: "Failed to start voice input. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        type="button" 
        onClick={toggleListening}
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
