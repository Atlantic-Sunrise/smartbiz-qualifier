
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
      
      // Fetch profile data for this user
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // If the error is that no rows were returned, it might mean the profile doesn't exist yet
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating a new one');
          
          // Try to create a profile
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([{ id: user.id }]);
            
          if (insertError) {
            console.error('Error creating profile:', insertError);
            throw insertError;
          }
          
          // Fetch the newly created profile
          const { data: newProfile, error: newProfileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (newProfileError) {
            console.error('Error fetching new profile:', newProfileError);
            throw newProfileError;
          }
          
          console.log("New profile created:", newProfile);
          setProfile(newProfile);
        } else {
          console.error('Error fetching profile:', error);
          throw error;
        }
      } else {
        console.log("Profile data retrieved:", data);
        setProfile(data);
      }
      
      // Never show API key input, as we've removed that feature
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
