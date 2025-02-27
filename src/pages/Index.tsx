
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BusinessQualificationForm } from "@/components/BusinessQualificationForm";
import { QualificationResults } from "@/components/QualificationResults";
import { BusinessProfileSetup } from "@/components/BusinessProfileSetup";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [results, setResults] = useState<any>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
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

      const { data, error } = await supabase
        .from('profiles')
        .select('*, api_keys')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch profile data",
        });
        return;
      }
      
      setProfile(data);
      
      // Check if Gemini API key exists
      const apiKeys = data?.api_keys || {};
      const hasGeminiKey = !!apiKeys.gemini_api_key;
      setShowApiKeyInput(!hasGeminiKey);
      
      if (hasGeminiKey) {
        // Set API key in localStorage for the library to use
        localStorage.setItem('gemini_api_key', apiKeys.gemini_api_key);
        console.log('Gemini API key found in profile');
      } else {
        console.log('Missing Gemini API key');
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile data",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out",
      });
    } else {
      navigate("/auth");
    }
  };
  
  const handleApiKeySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
      
      setShowApiKeyInput(false);
      toast({
        title: "Success",
        description: "API key has been saved securely",
      });
      
      await fetchProfile();
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div 
        className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=2400&q=80')] opacity-5 bg-cover bg-center pointer-events-none"
        style={{ mixBlendMode: 'overlay' }}
      />
      <div className="container relative py-12 z-10">
        <div className="flex justify-between items-center mb-8 backdrop-blur-sm bg-white/30 dark:bg-black/30 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
          {profile?.company_name && (
            <div className="text-left">
              <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
                {profile.company_name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{profile.industry}</p>
            </div>
          )}
          <Button variant="outline" onClick={handleLogout} className="hover:bg-gray-100 dark:hover:bg-gray-800">
            Sign Out
          </Button>
        </div>

        {!profile?.company_name ? (
          <BusinessProfileSetup onComplete={fetchProfile} />
        ) : (
          <>
            <div className="text-center mb-12 animate-fadeIn">
              <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
                Business Lead Qualifier
              </h1>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto backdrop-blur-sm bg-white/30 dark:bg-black/30 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                Enter your prospect's business information below for AI-powered analysis and qualification scoring.
              </p>
            </div>

            {showApiKeyInput ? (
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
                  <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
                    Save API Key
                  </Button>
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
                      className="mt-4 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Qualify Another Lead
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
