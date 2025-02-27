
import { useState, useEffect } from "react";
import { fetchQualifications, deleteQualification } from "@/services/businessFormService";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PreviousQualificationsProps {
  onSelectResult: (results: any, businessName: string) => void;
}

export function PreviousQualifications({ onSelectResult }: PreviousQualificationsProps) {
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadQualifications();
  }, []);

  const loadQualifications = async () => {
    try {
      setIsLoading(true);
      const data = await fetchQualifications();
      setQualifications(data);
    } catch (error) {
      console.error("Error loading qualifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the row click
    
    try {
      setIsDeleting(id);
      await deleteQualification(id);
      setQualifications(qualifications.filter(q => q.id !== id));
      
      toast({
        title: "Deleted",
        description: "Qualification has been removed.",
      });
    } catch (error) {
      console.error("Error deleting qualification:", error);
      toast({
        title: "Error",
        description: "Failed to delete qualification.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSelect = (qualification: any) => {
    const results = {
      score: qualification.qualification_score,
      summary: qualification.qualification_summary,
      insights: qualification.qualification_insights,
      recommendations: qualification.qualification_recommendations
    };
    
    onSelectResult(results, qualification.company_name);
  };

  // Extract a one-word key need from the qualification data
  const extractKeyNeed = (qualification: any): string => {
    // Return the stored key_need if it exists
    if (qualification.key_need) {
      return qualification.key_need;
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

    // Combine summary and challenges into a single text to analyze
    const text = (qualification.qualification_summary || "") + " " + (qualification.challenges || "");
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

  // If there are no previous qualifications, don't show this component
  if (!isLoading && qualifications.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-center">Recent Lead Qualifications</h2>
      </div>
      
      <div className="w-full">
        {isLoading ? (
          <div className="h-20 animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
        ) : (
          <div className="border rounded-md">
            {/* Excel-like table with both horizontal and vertical scrollbars */}
            <div className="overflow-auto max-h-[300px]" style={{ maxWidth: '100%' }}>
              <Table>
                <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                  <TableRow>
                    <TableHead className="min-w-[150px]">Company</TableHead>
                    <TableHead className="min-w-[120px]">Industry</TableHead>
                    <TableHead className="min-w-[100px]">Revenue</TableHead>
                    <TableHead className="min-w-[80px]">Score</TableHead>
                    <TableHead className="min-w-[120px]">Key Need</TableHead>
                    <TableHead className="min-w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qualifications.map((qualification) => (
                    <TableRow
                      key={qualification.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => handleSelect(qualification)}
                    >
                      <TableCell className="font-medium whitespace-nowrap">{qualification.company_name}</TableCell>
                      <TableCell className="whitespace-nowrap">{qualification.industry}</TableCell>
                      <TableCell className="whitespace-nowrap">{qualification.annual_revenue}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className={`font-semibold ${
                          qualification.qualification_score >= 80 ? "text-green-500" : 
                          qualification.qualification_score >= 60 ? "text-yellow-500" : "text-red-500"
                        }`}>
                          {qualification.qualification_score}/100
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                          {qualification.key_need || extractKeyNeed(qualification)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isDeleting === qualification.id}
                            onClick={(e) => handleDelete(qualification.id, e)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 p-1 h-auto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost" 
                            size="sm"
                            className="text-purple-500 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30 p-1 h-auto"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
