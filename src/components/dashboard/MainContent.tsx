
import { useState } from "react";
import { QualificationFormSection } from "./QualificationFormSection";
import { ResultsDisplay } from "./ResultsDisplay";
import { BusinessProfileSetup } from "@/components/BusinessProfileSetup";
import { PageTitle } from "@/components/layout/PageTitle";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";

export function MainContent() {
  const [results, setResults] = useState<any>(null);
  const [businessName, setBusinessName] = useState<string>("");
  const { profile } = useProfile();

  const handleResults = (resultsData: any, companyName: string) => {
    setResults(resultsData);
    setBusinessName(companyName);
  };

  const handleReset = () => {
    setResults(null);
  };

  if (!profile?.company_name) {
    return <BusinessProfileSetup onComplete={() => window.location.reload()} />;
  }

  return (
    <>
      <PageTitle />

      <div className="space-y-8 w-full">
        {!results ? (
          <QualificationFormSection onResultsReceived={handleResults} />
        ) : (
          <ResultsDisplay 
            results={results} 
            businessName={businessName} 
            onReset={handleReset} 
          />
        )}
      </div>
    </>
  );
}
