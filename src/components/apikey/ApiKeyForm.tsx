
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ApiKeyFormProps {
  onApiKeySaved: () => void;
}

export function ApiKeyForm({ onApiKeySaved }: ApiKeyFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleApiKeySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const geminiApiKey = formData.get('geminiApiKey') as string;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No user found. Please sign in again.",
        });
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          api_keys: {
            gemini_api_key: geminiApiKey
          }
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving API key:', error);
        throw error;
      }

      // Update localStorage for immediate use
      localStorage.setItem('gemini_api_key', geminiApiKey);
      
      toast({
        title: "Success",
        description: "API key has been saved securely",
      });
      
      onApiKeySaved();
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6 backdrop-blur-sm bg-white/60 dark:bg-black/60 border border-gray-200 dark:border-gray-800 shadow-xl">
      <form onSubmit={handleApiKeySubmit} className="space-y-4">
        <div>
          <Label htmlFor="geminiApiKey">Google Gemini API Key</Label>
          <Input
            id="geminiApiKey"
            name="geminiApiKey"
            type="password"
            placeholder="Enter your Google Gemini API key"
            required
            className="bg-white/80 dark:bg-gray-800/80"
          />
        </div>
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save API Key"}
        </Button>
      </form>
    </Card>
  );
}
