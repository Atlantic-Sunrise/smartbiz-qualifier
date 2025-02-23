
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
  
  const recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
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

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(result => result[0].transcript)
      .join(" ");
    
    if (event.results[0].isFinal) {
      console.log("Final transcript:", transcript);
      onFieldUpdate(transcript);
    }
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    toast({
      title: "Error",
      description: "There was an error with the voice input. Please try again.",
      variant: "destructive",
    });
    setIsListening(false);
  };

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
    if (isListening) {
      recognition.stop();
    } else {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) return;
      
      try {
        recognition.start();
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
