
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
      
      // FIXED: Only show API key input during initial setup, never after
      // If the user has a company name set, they've completed initial setup
      const hasCompletedSetup = data?.company_name;
      setShowApiKeyInput(false); // Never show API key input by default
      
      // If user has provided their own API key, store it in localStorage
      const apiKeys = data?.api_keys || {};
      if (apiKeys.gemini_api_key) {
        localStorage.setItem('gemini_api_key', apiKeys.gemini_api_key);
        console.log('Personal Gemini API key found in profile');
      } else {
        // Always use the shared key if no personal key is set
        console.log('Using shared API key');
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
