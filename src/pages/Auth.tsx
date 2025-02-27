
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
      (event, session) => {
        if (event === "SIGNED_IN" && session) {
          // First ensure the user has a profile
          ensureUserProfile(session.user.id).then(() => {
            navigate('/');
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Ensure user has a profile record
  const ensureUserProfile = async (userId: string) => {
    try {
      // Check if profile exists
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // If no profile exists, create one
      if (error && error.code === 'PGRST116') {
        console.log('Creating new profile for user', userId);
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{ id: userId }]);

        if (insertError) {
          console.error('Error creating profile:', insertError);
          throw insertError;
        }
      } else if (error) {
        console.error('Error checking profile:', error);
        throw error;
      } else {
        console.log('User profile exists:', data);
      }
    } catch (error) {
      console.error('Error in ensureUserProfile:', error);
      toast({
        variant: "destructive",
        title: "Profile Error",
        description: "There was an error setting up your profile. Please try again.",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setRateLimitError(false);

    try {
      // Check if email exists in the system first
      const { data, error: userCheckError } = await supabase.auth.admin?.listUsers({
        filter: {
          email: email
        }
      });
      
      // If the above admin API is not available (which is likely), we can't reliably check
      // This is just an attempt but likely won't work for most setups
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
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Rate Limit Exceeded</h3>
              <div className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                <p>Too many magic link emails have been sent to this address recently.</p>
                <p className="mt-1">Please wait about 20-30 minutes before trying again, or check your inbox for an existing magic link.</p>
                {isNewUser && (
                  <div className="mt-2 flex items-start gap-2">
                    <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                    <p>If this is your first time logging in, please try using a different email address.</p>
                  </div>
                )}
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
