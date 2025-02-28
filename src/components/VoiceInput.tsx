
import { Button } from "@/components/ui/button";
import { Mic, MicOff, StopCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useState, useRef, useEffect } from "react";

interface VoiceInputProps {
  onFieldUpdate: (value: string) => void;
}

export function VoiceInput({ onFieldUpdate }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<number | null>(null);
  
  // Cleanup function for when component unmounts or recognition stops
  const cleanupRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onresult = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };
  
  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupRecognition();
    };
  }, []);
  
  const startListening = async () => {
    try {
      // If already listening, do nothing
      if (isListening) return;
      
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Cleanup any existing recognition instance
      cleanupRecognition();
      
      // Create new recognition instance
      recognitionRef.current = new (window.webkitSpeechRecognition)();
      recognitionRef.current.continuous = true; // Keep listening until stopped
      recognitionRef.current.interimResults = false; // Only get final results
      
      recognitionRef.current.onstart = () => {
        console.log("Started listening");
        setIsListening(true);
        
        // Set timeout for 300 seconds (5 minutes)
        timeoutRef.current = window.setTimeout(() => {
          console.log("Listening timeout after 300 seconds");
          stopListening();
          
          toast({
            title: "Voice Input Timeout",
            description: "Voice recording stopped after 5 minutes. Click to start recording again.",
            variant: "default",
          });
        }, 300000); // 300 seconds = 5 minutes
      };

      recognitionRef.current.onend = () => {
        console.log("Stopped listening");
        setIsListening(false);
      };

      recognitionRef.current.onresult = (event: any) => {
        // Get the latest result
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript;
        console.log("Transcript:", transcript);
        onFieldUpdate(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        toast({
          title: "Error",
          description: "There was an error with the voice input. Please try again.",
          variant: "destructive",
        });
        stopListening();
      };

      recognitionRef.current.start();
    } catch (error) {
      console.error("Microphone access error:", error);
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to use voice input.",
        variant: "destructive",
      });
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsListening(false);
  };

  return (
    <div className="space-y-4">
      {isListening ? (
        <Button 
          type="button" 
          onClick={stopListening}
          variant="outline"
          className="w-full flex items-center justify-center gap-2 border-red-400"
        >
          <StopCircle className="h-4 w-4 text-red-500" />
          Stop Recording
        </Button>
      ) : (
        <Button 
          type="button" 
          onClick={startListening}
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
        >
          <Mic className="h-4 w-4" />
          Click to Start Speaking
        </Button>
      )}
    </div>
  );
}
