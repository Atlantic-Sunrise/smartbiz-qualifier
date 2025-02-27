
import { useState } from "react";
import { QualificationFormSection } from "./QualificationFormSection";
import { ResultsDisplay } from "./ResultsDisplay";
import { BusinessProfileSetup } from "@/components/BusinessProfileSetup";
import { ApiKeyForm } from "@/components/apikey/ApiKeyForm";
import { PageTitle } from "@/components/layout/PageTitle";
import { useProfile } from "@/context/ProfileContext";

export function MainContent() {
  const [results, setResults] = useState<any>(null);
  const [businessName, setBusinessName] = useState<string>("");
  const { profile, showApiKeyInput, setShowApiKeyInput, refreshProfile } = useProfile();

  const handleApiKeySaved = async () => {
    setShowApiKeyInput(false);
    await refreshProfile();
  };

  const handleResults = (resultsData: any, companyName: string) => {
    setResults(resultsData);
    setBusinessName(companyName);
  };

  const handleReset = () => {
    setResults(null);
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
      )}
    </>
  );
}
