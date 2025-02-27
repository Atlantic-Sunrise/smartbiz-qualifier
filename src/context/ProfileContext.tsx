
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface ProfileContextType {
  profile: any;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  showApiKeyInput: boolean;
  setShowApiKeyInput: (show: boolean) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <ProfileContext.Provider value={{ 
      profile, 
      loading, 
      refreshProfile: fetchProfile,
      showApiKeyInput,
      setShowApiKeyInput 
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
