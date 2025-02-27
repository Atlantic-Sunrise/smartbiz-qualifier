
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
      
      setMagicLinkSent(true);
      toast({
        title: "Magic link sent!",
        description: "Check your email for a login link.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            {magicLinkSent ? "Check Your Email" : "Welcome to Lead Qualifier"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {magicLinkSent
              ? "We've sent you a magic link to your email"
              : "Sign in with your email to get started"}
          </p>
        </div>

        {!magicLinkSent ? (
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
              {loading ? "Sending..." : "Send Magic Link"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-sm text-gray-500">
              We've sent a magic link to <strong>{email}</strong>. 
              Check your email and click the link to log in.
            </p>
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={() => setMagicLinkSent(false)}
            >
              Back to Login
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
