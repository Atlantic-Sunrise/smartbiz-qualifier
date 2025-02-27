
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

  // Extract a one-word key need from the qualification data
  const extractKeyNeed = (qualification: any): string => {
    // Return the stored challenge if it exists
    if (qualification.challenge) {
      return qualification.challenge;
    }
    
    // Common business need categories
    const needKeywords: Record<string, string[]> = {
      "growth": ["growth", "scale", "expand", "acquisition", "customer", "revenue", "sales", "market share"],
      "marketing": ["marketing", "branding", "advertising", "visibility", "promotion", "awareness"],
      "finance": ["finance", "funding", "cash flow", "investment", "budget", "cost", "profit", "pricing"],
      "operations": ["operations", "efficiency", "process", "workflow", "productivity", "logistics"],
      "talent": ["talent", "hiring", "recruitment", "staff", "employee", "retention", "team", "workforce"],
      "technology": ["technology", "digital", "software", "automation", "integration", "infrastructure", "IT"],
      "competition": ["competition", "competitive", "market", "industry", "disruption"],
      "innovation": ["innovation", "product", "development", "R&D", "creative", "design"],
      "compliance": ["compliance", "regulation", "legal", "policy", "standard"],
      "strategy": ["strategy", "planning", "direction", "vision", "mission", "pivot"]
    };

    // Create a text to analyze from the qualification data
    const text = (qualification.qualification_summary || "") + " " + 
                 (qualification.qualification_insights || []).join(" ") + " " + 
                 (qualification.qualification_recommendations || []).join(" ");
    const lowerText = text.toLowerCase();
    
    // Find which category has the most keyword matches
    let bestCategory = "growth"; // Default
    let highestMatches = 0;
    
    for (const [category, keywords] of Object.entries(needKeywords)) {
      const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
      if (matches > highestMatches) {
        highestMatches = matches;
        bestCategory = category;
      }
    }
    
    return bestCategory.charAt(0).toUpperCase() + bestCategory.slice(1);
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
        annualRevenue: qual.annual_revenue,
        createdAt: qual.created_at,
        keyNeed: qual.challenge || extractKeyNeed(qual) // Use stored value or extract it
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
              
              {/* Bottom section with Previous Qualifications */}
              <div className="flex flex-col items-center space-y-8 mt-12">
                {/* Previous Qualifications Section */}
                <div className="w-full max-w-4xl mx-auto">
                  <PreviousQualifications onSelectResult={(result, name) => {
                    setResults(result);
                    setBusinessName(name);
                  }} />
                  
                  {/* Email All Summaries Button - Moved to bottom of page */}
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
