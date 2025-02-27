
import { useState } from "react";
import { BusinessQualificationForm } from "@/components/BusinessQualificationForm";
import { QualificationResults } from "@/components/QualificationResults";
import { BusinessProfileSetup } from "@/components/BusinessProfileSetup";
import { PreviousQualifications } from "@/components/PreviousQualifications";
import { ApiKeyForm } from "@/components/apikey/ApiKeyForm";
import { PageTitle } from "@/components/layout/PageTitle";
import { useProfile } from "@/context/ProfileContext";
import { Button } from "@/components/ui/button";

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

  if (!profile?.company_name) {
    return <BusinessProfileSetup onComplete={refreshProfile} />;
  }

  return (
    <>
      <PageTitle />

      {showApiKeyInput ? (
        <ApiKeyForm onApiKeySaved={handleApiKeySaved} />
      ) : (
        <div className="space-y-8">
          {!results && (
            <>
              <PreviousQualifications onSelectResult={(result, name) => {
                setResults(result);
                setBusinessName(name);
              }} />
              <BusinessQualificationForm onResults={handleResults} />
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
