
import { useState } from "react";
import { BusinessQualificationForm } from "@/components/BusinessQualificationForm";
import { QualificationResults } from "@/components/QualificationResults";
import { BusinessProfileSetup } from "@/components/BusinessProfileSetup";
import { PreviousQualifications } from "@/components/PreviousQualifications";
import { ApiKeyForm } from "@/components/apikey/ApiKeyForm";
import { PageTitle } from "@/components/layout/PageTitle";
import { useProfile } from "@/context/ProfileContext";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { sendMultipleQualificationsSummary } from "@/services/emailService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function MainContent() {
  const [results, setResults] = useState<any>(null);
  const [businessName, setBusinessName] = useState<string>("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const { profile, showApiKeyInput, setShowApiKeyInput, refreshProfile } = useProfile();
  const { toast } = useToast();

  const handleApiKeySaved = async () => {
    setShowApiKeyInput(false);
    await refreshProfile();
  };

  const handleResults = (resultsData: any, companyName: string) => {
    setResults(resultsData);
    setBusinessName(companyName);
  };

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
        createdAt: qual.created_at
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

  if (!profile?.company_name) {
    return <BusinessProfileSetup onComplete={refreshProfile} />;
  }

  return (
    <>
      <PageTitle />

      {showApiKeyInput ? (
        <ApiKeyForm onApiKeySaved={handleApiKeySaved} />
      ) : (
        <div className="space-y-8 w-full">
          {!results && (
            <>
              {/* Business Qualification Form - Now at the top */}
              <div className="w-full">
                <BusinessQualificationForm onResults={handleResults} />
              </div>
              
              {/* Bottom section with Previous Qualifications and Email button */}
              <div className="flex flex-col items-center space-y-8 mt-12">
                {/* Email All Summaries Button */}
                <div className="flex justify-center w-full">
                  <Button 
                    onClick={handleSendAllSummaries}
                    disabled={isSendingEmail}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Mail className="h-4 w-4" />
                    {isSendingEmail ? "Sending..." : "Email All Summaries"}
                  </Button>
                </div>
                
                {/* Previous Qualifications Section */}
                <div className="w-full max-w-4xl mx-auto">
                  <PreviousQualifications onSelectResult={(result, name) => {
                    setResults(result);
                    setBusinessName(name);
                  }} />
                </div>
              </div>
            </>
          )}
          {results && <QualificationResults results={results} businessName={businessName} />}
          {results && (
            <div className="text-center">
              <Button 
                onClick={() => setResults(null)}
                variant="outline"
                className="mt-4 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Qualify Another Lead
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
