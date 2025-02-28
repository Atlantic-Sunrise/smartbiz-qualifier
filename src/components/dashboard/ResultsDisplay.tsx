
import { Button } from "@/components/ui/button";
import { QualificationResults } from "@/components/QualificationResults";
import { FileDown } from "lucide-react";

interface ResultsDisplayProps {
  results: any;
  businessName: string;
  onReset: () => void;
}

export function ResultsDisplay({ results, businessName, onReset }: ResultsDisplayProps) {
  const handleDownloadReport = () => {
    // Format the report content
    const reportContent = generateReportText(results, businessName);
    
    // Create a Blob with the text content
    const blob = new Blob([reportContent], { type: 'text/plain' });
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = `${businessName.replace(/\s+/g, '-').toLowerCase()}-qualification-report.txt`;
    
    // Append to the document, click it, then remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Release the URL object
    URL.revokeObjectURL(url);
  };
  
  // Function to generate the text content for the report
  const generateReportText = (results: any, businessName: string): string => {
    const { score, summary, insights, recommendations } = results;
    
    // Get current date
    const date = new Date().toLocaleDateString();
    
    // Build the report content
    let content = `LEAD QUALIFICATION REPORT\n`;
    content += `=======================\n\n`;
    content += `Business: ${businessName}\n`;
    content += `Date: ${date}\n`;
    content += `Qualification Score: ${score}/100\n\n`;
    
    content += `SUMMARY\n-------\n`;
    content += `${summary}\n\n`;
    
    content += `KEY INSIGHTS\n------------\n`;
    if (insights && insights.length > 0) {
      insights.forEach((insight: string, index: number) => {
        content += `${index + 1}. ${insight}\n`;
      });
    } else {
      content += `No insights available.\n`;
    }
    content += `\n`;
    
    content += `RECOMMENDATIONS\n---------------\n`;
    if (recommendations && recommendations.length > 0) {
      recommendations.forEach((recommendation: string, index: number) => {
        content += `${index + 1}. ${recommendation}\n`;
      });
    } else {
      content += `No recommendations available.\n`;
    }
    
    content += `\n=======================\n`;
    content += `Generated by Lead Qualification Tool`;
    
    return content;
  };

  return (
    <>
      <QualificationResults results={results} businessName={businessName} />
      <div className="text-center space-y-3 mt-6">
        <Button 
          onClick={handleDownloadReport}
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800 hover:border-blue-300 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/50 dark:hover:text-blue-200"
        >
          <FileDown className="mr-2 h-4 w-4" />
          Download Report as Text File
        </Button>
        <div>
          <Button 
            onClick={onReset}
            variant="outline"
            className="mt-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Qualify Another Lead
          </Button>
        </div>
      </div>
    </>
  );
}
