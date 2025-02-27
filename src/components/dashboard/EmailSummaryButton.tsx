
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { sendMultipleQualificationsSummary } from "@/services/emailService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface EmailSummaryButtonProps {
  extractKeyNeed: (qualification: any) => string;
}

export function EmailSummaryButton({ extractKeyNeed }: EmailSummaryButtonProps) {
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const { toast } = useToast();

  const handleSendAllSummaries = async () => {
    try {
      setIsSendingEmail(true);
      
      // Get current user's email
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !user.email) {
        throw new Error("User email not found. Please ensure you're logged in.");
      }
      
      // Fetch all qualifications
      const { data: qualifications, error } = await supabase
        .from('business_qualifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (!qualifications || qualifications.length === 0) {
        throw new Error("No qualifications available to send.");
      }
      
      // Prepare the data for all qualifications
      const allQualifications = qualifications.map(qual => ({
        businessName: qual.company_name,
        score: qual.qualification_score,
        summary: qual.qualification_summary,
        insights: qual.qualification_insights,
        recommendations: qual.qualification_recommendations,
        industry: qual.industry,
        annualRevenue: qual.annual_revenue,
        createdAt: qual.created_at,
        keyNeed: qual.key_need || extractKeyNeed(qual) // Use stored value or extract it
      }));
      
      // Send the email
      await sendMultipleQualificationsSummary({
        email: user.email,
        qualifications: allQualifications
      });
      
      toast({
        title: "Summary Sent",
        description: `Summary of all lead qualifications has been sent to ${user.email}`,
      });
    } catch (error) {
      console.error("Error sending summaries:", error);
      toast({
        title: "Email Failed",
        description: error instanceof Error ? error.message : "Failed to send summary email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="flex justify-center w-full mt-8">
      <Button 
        onClick={handleSendAllSummaries}
        disabled={isSendingEmail}
        className="w-full max-w-2xl bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white transition-all duration-300 flex items-center justify-center gap-2"
      >
        {isSendingEmail ? (
          <>
            <Mail className="h-4 w-4 animate-pulse" />
            Sending...
          </>
        ) : (
          <>
            <Mail className="h-4 w-4" />
            Email All Summaries
          </>
        )}
      </Button>
    </div>
  );
}
