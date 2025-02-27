
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
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

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) throw error;
      
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
