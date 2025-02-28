
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
        .maybeSingle(); // Use maybeSingle instead of single to handle case where profile might not exist

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      if (!data) {
        console.log('Profile not found, creating a new one');
        
        // Try to create a profile
        const { error: insertError, data: newProfile } = await supabase
          .from('profiles')
          .insert([{ 
            id: user.id,
            updated_at: new Date().toISOString()
          }])
          .select('*')
          .single();
          
        if (insertError) {
          console.error('Error creating profile:', insertError);
          
          // Try an alternative approach with upsert
          const { error: upsertError, data: upsertedProfile } = await supabase
            .from('profiles')
            .upsert([{ id: user.id }], { onConflict: 'id' })
            .select('*')
            .single();
            
          if (upsertError) {
            console.error('Error upserting profile:', upsertError);
            throw upsertError;
          }
          
          console.log("New profile created via upsert:", upsertedProfile);
          setProfile(upsertedProfile);
        } else {
          console.log("New profile created via insert:", newProfile);
          setProfile(newProfile);
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
