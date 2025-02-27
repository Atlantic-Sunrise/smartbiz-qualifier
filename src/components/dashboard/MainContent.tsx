
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
  const { profile, showApiKeyInput, setShowApiKeyInput, refreshProfile } = useProfile();

  const handleApiKeySaved = async () => {
    setShowApiKeyInput(false);
    await refreshProfile();
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
              <PreviousQualifications onSelectResult={setResults} />
              <BusinessQualificationForm onResults={setResults} />
            </>
          )}
          {results && <QualificationResults results={results} />}
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
