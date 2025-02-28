
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rateLimitError, setRateLimitError] = useState(false);
  const [resetPasswordEmail, setResetPasswordEmail] = useState("");
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const params = new URLSearchParams(window.location.search);
      const isRecoveryFlow = params.has('type') && params.get('type') === 'recovery';
      
      if (isRecoveryFlow) {
        setShowPasswordReset(true);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);

        if (event === "PASSWORD_RECOVERY") {
          setShowPasswordReset(true);
          return;
        }

        if (event === "SIGNED_IN" && session && !showPasswordReset) {
          navigate('/');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, showPasswordReset]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setRateLimitError(false);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        if (error.message.toLowerCase().includes('rate limit') || 
            error.message.includes('429')) {
          setRateLimitError(true);
          console.error("Rate limit error:", error.message);
          throw new Error("Rate limit exceeded. Please wait a few minutes before trying again.");
        }
        throw error;
      }
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing in",
        description: error.message || "An unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setRateLimitError(false);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) {
        if (error.message.toLowerCase().includes('rate limit') || 
            error.message.includes('429')) {
          setRateLimitError(true);
          console.error("Rate limit error:", error.message);
          throw new Error("Rate limit exceeded. Please wait a few minutes before trying again.");
        }
        throw error;
      }
      
      toast({
        title: "Account created!",
        description: "Check your email to confirm your account.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating account",
        description: error.message || "An unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendPasswordResetEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetPasswordEmail, {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });

      if (error) {
        if (error.message.toLowerCase().includes('rate limit') || 
            error.message.includes('429')) {
          setRateLimitError(true);
          console.error("Rate limit error:", error.message);
          throw new Error("Rate limit exceeded. Please wait a few minutes before trying again.");
        }
        throw error;
      }

      toast({
        title: "Reset link sent",
        description: "Check your email for a password reset link",
      });
      
      setResetPasswordDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error sending reset link",
        description: error.message || "An unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure both passwords match.",
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Password updated successfully",
        description: "You can now sign in with your new password",
      });
      
      setTimeout(() => {
        setShowPasswordReset(false);
        window.history.replaceState({}, document.title, "/auth");
      }, 1500);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating password",
        description: error.message || "An unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  if (showPasswordReset) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Reset Your Password</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter a new password for your account
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500">Password must be at least 6 characters</p>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating Password..." : "Update Password"}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome to Lead Qualifier</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sign in or create an account to continue
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

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing In..." : "Sign In"}
              </Button>

              <div className="text-center mt-2 flex justify-center gap-4">
                <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="link" className="text-sm">
                      Forgot password?
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reset Your Password</DialogTitle>
                      <DialogDescription>
                        Enter your email to receive a password reset link
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSendPasswordResetEmail} className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="you@company.com"
                          value={resetPasswordEmail}
                          onChange={(e) => setResetPasswordEmail(e.target.value)}
                          required
                        />
                      </div>
                      <p className="text-sm text-gray-500">
                        Enter your email address and we'll send you a password reset link.
                      </p>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Sending..." : "Send Reset Link"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500">Password must be at least 6 characters</p>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
