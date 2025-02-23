
import { useState } from "react";
import { BusinessQualificationForm } from "@/components/BusinessQualificationForm";
import { QualificationResults } from "@/components/QualificationResults";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [results, setResults] = useState<any>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(!localStorage.getItem('perplexity_api_key'));
  const { toast } = useToast();
  
  const handleApiKeySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const apiKey = formData.get('apiKey') as string;
    
    if (apiKey) {
      localStorage.setItem('perplexity_api_key', apiKey);
      setShowApiKeyInput(false);
      toast({
        title: "Success",
        description: "API key has been saved",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container py-12">
        <div className="text-center mb-12 animate-fadeIn">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Business Lead Qualifier
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Enter your business information below for an AI-powered analysis of your lead qualification score and detailed insights.
          </p>
        </div>

        {showApiKeyInput ? (
          <Card className="w-full max-w-md mx-auto p-6 backdrop-blur-sm bg-white/30 dark:bg-black/30 border border-gray-200 dark:border-gray-800">
            <form onSubmit={handleApiKeySubmit} className="space-y-4">
              <div>
                <Label htmlFor="apiKey">Perplexity API Key</Label>
                <Input
                  id="apiKey"
                  name="apiKey"
                  type="password"
                  placeholder="Enter your Perplexity API key"
                  required
                />
              </div>
              <Button type="submit" className="w-full">Save API Key</Button>
            </form>
          </Card>
        ) : (
          <div className="space-y-8">
            {!results && <BusinessQualificationForm onResults={setResults} />}
            {results && <QualificationResults results={results} />}
            {results && (
              <div className="text-center">
                <Button 
                  onClick={() => setResults(null)}
                  variant="outline"
                  className="mt-4"
                >
                  Qualify Another Lead
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
