
import { Button } from "@/components/ui/button";
import { QualificationResults } from "@/components/QualificationResults";

interface ResultsDisplayProps {
  results: any;
  businessName: string;
  onReset: () => void;
}

export function ResultsDisplay({ results, businessName, onReset }: ResultsDisplayProps) {
  return (
    <>
      <QualificationResults results={results} businessName={businessName} />
      <div className="text-center">
        <Button 
          onClick={onReset}
          variant="outline"
          className="mt-4 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Qualify Another Lead
        </Button>
      </div>
    </>
  );
}
