
import { useState } from "react";
import { BusinessQualificationForm } from "@/components/BusinessQualificationForm";
import { PreviousQualifications } from "@/components/PreviousQualifications";
import { EmailSummaryButton } from "./EmailSummaryButton";
import { extractKeyNeed } from "@/utils/extractKeyNeed";

interface QualificationFormSectionProps {
  onResultsReceived: (resultsData: any, companyName: string) => void;
}

export function QualificationFormSection({ onResultsReceived }: QualificationFormSectionProps) {
  return (
    <>
      {/* Business Qualification Form */}
      <div className="w-full">
        <BusinessQualificationForm onResults={onResultsReceived} />
      </div>
      
      {/* Bottom section with Previous Qualifications */}
      <div className="flex flex-col items-center space-y-8 mt-12">
        {/* Previous Qualifications Section */}
        <div className="w-full max-w-4xl mx-auto">
          <PreviousQualifications onSelectResult={onResultsReceived} />
          
          {/* Email All Summaries Button */}
          <EmailSummaryButton extractKeyNeed={extractKeyNeed} />
        </div>
      </div>
    </>
  );
}
