
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
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user) {
        console.log("No authenticated session found");
        setLoading(false);
        if (window.location.pathname !== '/auth') {
          navigate("/auth");
        }
        return;
      }

      const user = session.user;
      console.log("Fetching profile for user:", user.id);
      
      // Try to get profile with a simple query
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.log("Error or no profile found, attempting to create one");
        
        // Create a profile with upsert
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .upsert({ id: user.id })
          .select();
        
        if (profileError) {
          console.error("Error creating profile:", profileError);
          throw profileError;
        }
        
        setProfile(profileData[0]);
        console.log("New profile created:", profileData[0]);
      } else {
        setProfile(data);
        console.log("Existing profile found:", data);
      }
      
      setShowApiKeyInput(false);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (window.location.pathname !== '/auth') {
      fetchProfile();
    } else {
      setLoading(false);
    }

    // Listen for auth state changes to refresh profile
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          fetchProfile();
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          if (window.location.pathname !== '/auth') {
            navigate("/auth");
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
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
