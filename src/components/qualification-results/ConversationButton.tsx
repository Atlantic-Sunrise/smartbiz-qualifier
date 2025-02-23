
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConversationButtonProps {
  isConversing: boolean;
  onClick: () => void;
}

export function ConversationButton({ isConversing, onClick }: ConversationButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className="mt-4"
    >
      {isConversing ? (
        <>
          <Mic className="mr-2 h-4 w-4 animate-pulse text-red-500" />
          Stop Conversation
        </>
      ) : (
        <>
          <MicOff className="mr-2 h-4 w-4" />
          Discuss Results with AI
        </>
      )}
    </Button>
  );
}
