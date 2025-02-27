
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, FileText } from "lucide-react";
import { sendMultipleQualificationsSummary } from "@/services/emailService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface EmailSummaryButtonProps {
  extractKeyNeed: (qualification: any) => string;
}

export function EmailSummaryButton({ extractKeyNeed }: EmailSummaryButtonProps) {
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingDetailed, setIsSendingDetailed] = useState(false);
  const { toast } = useToast();

  const handleSendAllSummaries = async (includeDetails: boolean) => {
    try {
      if (includeDetails) {
        setIsSendingDetailed(true);
      } else {
        setIsSendingEmail(true);
      }
      
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
        keyNeed: qual.key_need || extractKeyNeed(qual)
      }));
      
      // Send the email
      await sendMultipleQualificationsSummary({
        email: user.email,
        qualifications: allQualifications,
        includeDetails
      });
      
      toast({
        title: "Summary Sent",
        description: `${includeDetails ? 'Detailed reports' : 'Summary'} has been sent to ${user.email}`,
      });
    } catch (error) {
      console.error("Error sending summaries:", error);
      toast({
        title: "Email Failed",
        description: error instanceof Error ? error.message : "Failed to send summary email. Please try again.",
        variant: "destructive",
      });
    } finally {
      if (includeDetails) {
        setIsSendingDetailed(false);
      } else {
        setIsSendingEmail(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center w-full mt-8 space-y-4">
      <Button 
        onClick={() => handleSendAllSummaries(false)}
        disabled={isSendingEmail}
        className="w-full max-w-2xl bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-800 dark:hover:to-gray-900 dark:text-white transition-all duration-300 flex items-center justify-center gap-2"
      >
        {isSendingEmail ? (
          <>
            <Mail className="h-4 w-4 animate-pulse" />
            Sending...
          </>
        ) : (
          <>
            <Mail className="h-4 w-4" />
            Email Summary Table
          </>
        )}
      </Button>

      <Button 
        onClick={() => handleSendAllSummaries(true)}
        disabled={isSendingDetailed}
        variant="outline"
        className="w-full max-w-2xl border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-2"
      >
        {isSendingDetailed ? (
          <>
            <FileText className="h-4 w-4 animate-pulse" />
            Sending Detailed Reports...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" />
            Send Detailed Reports
          </>
        )}
      </Button>
    </div>
  );
}
