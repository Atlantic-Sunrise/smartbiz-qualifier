
import { BusinessQualificationForm } from "@/components/BusinessQualificationForm";
import { Card } from "@/components/ui/card";

interface QualificationFormSectionProps {
  onResultsReceived: (results: any, businessName: string) => void;
}

export function QualificationFormSection({ onResultsReceived }: QualificationFormSectionProps) {
  return (
    <Card className="w-full p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold leading-none tracking-tight">Qualify a Business Lead</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Fill in the form below to analyze a potential lead's fit for your business.
          </p>
        </div>
        
        <BusinessQualificationForm onResults={onResultsReceived} />
      </div>
    </Card>
  );
}
