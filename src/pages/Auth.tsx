
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, Info } from "lucide-react";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [rateLimitError, setRateLimitError] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };

    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        if (event === "SIGNED_IN" && session) {
          try {
            // First ensure the user has a profile
            await ensureUserProfile(session.user.id);
            // Then navigate to home
            navigate('/');
          } catch (error) {
            console.error("Error during authentication:", error);
            // If there was an error, we should still navigate to avoid being stuck
            navigate('/');
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Ensure user has a profile record - robust implementation for all cases
  const ensureUserProfile = async (userId: string) => {
    try {
      console.log("Ensuring profile for user:", userId);
      
      // First check if profile exists
      const { data, error: selectError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId);
      
      // Handle no profile case
      if (selectError || (data && data.length === 0)) {
        console.log('Profile not found or error, creating new profile for user', userId);
        
        // Attempt to create a new profile
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert([{ 
            id: userId,
            updated_at: new Date().toISOString()
          }], { 
            onConflict: 'id' 
          });
          
        if (upsertError) {
          console.error('Error creating/updating profile:', upsertError);
          
          // Try an insert as a fallback if upsert failed
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([{ id: userId }]);
            
          if (insertError) {
            console.error('Error inserting profile:', insertError);
            toast({
              variant: "destructive",
              title: "Profile Error",
              description: "There was an error setting up your profile. Please try again or contact support.",
            });
          } else {
            console.log("Profile created successfully via insert");
          }
        } else {
          console.log("Profile created/updated successfully via upsert");
        }
      } else {
        console.log('User profile already exists:', data);
      }
    } catch (error) {
      console.error('Error in ensureUserProfile:', error);
      toast({
        variant: "destructive",
        title: "Profile Error",
        description: "There was an error setting up your profile. Please try again.",
      });
      throw error; // Rethrow to handle it in the calling function
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setRateLimitError(false);

    try {
      // We don't have a reliable way to check if user is new with client-side API
      // Just assume they're new for error messaging
      setIsNewUser(true);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) {
        // Check specifically for rate limit errors
        if (error.message.toLowerCase().includes('rate limit') || 
            error.message.includes('429')) {
          setRateLimitError(true);
          console.error("Rate limit error:", error.message);
          throw new Error("Email rate limit exceeded. Please wait a few minutes before trying again.");
        }
        throw error;
      }
      
      toast({
        title: "Magic link sent!",
        description: "Check your email for the login link.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome to Lead Qualifier</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter your email to sign in or create an account
          </p>
        </div>

        {rateLimitError && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Authentication Issue</h3>
              <div className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                <p>We're experiencing some authentication issues with this email address.</p>
                <p className="mt-1">This may be due to Supabase rate limits affecting new signups.</p>
                <div className="mt-2 flex items-start gap-2">
                  <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                  <p>Please try using a different email address for testing, or wait approximately 20-30 minutes.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending Magic Link..." : "Send Magic Link"}
          </Button>
        </form>
        
        <div className="text-center pt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            We'll email you a magic link for a password-free sign in.
          </p>
        </div>
      </Card>
    </div>
  );
}
