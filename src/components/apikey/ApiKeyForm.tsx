
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
        description: "Personal API key has been saved securely",
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

  const skipApiKey = () => {
    toast({
      title: "Using Shared API Key",
      description: "You'll be using the application's shared API key with limited usage.",
    });
    onApiKeySaved();
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6 backdrop-blur-sm bg-white/60 dark:bg-black/60 border border-gray-200 dark:border-gray-800 shadow-xl">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-center mb-2">API Key Setup (Optional)</h2>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
          You can use your own Gemini API key for better performance and no usage limits. 
          This is optional - you can also use our shared key with limited usage.
        </p>
      </div>
      
      <form onSubmit={handleApiKeySubmit} className="space-y-4">
        <div>
          <Label htmlFor="geminiApiKey">Google Gemini API Key (Optional)</Label>
          <Input
            id="geminiApiKey"
            name="geminiApiKey"
            type="password"
            placeholder="Enter your Google Gemini API key"
            className="bg-white/80 dark:bg-gray-800/80"
          />
          <p className="text-xs text-gray-500 mt-1">
            Get your API key from the <a href="https://aistudio.google.com/app/apikey" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Google AI Studio</a>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Button 
            type="button" 
            className="w-full" 
            variant="outline"
            onClick={skipApiKey}
          >
            Skip (Use Shared Key)
          </Button>
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save My API Key"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
