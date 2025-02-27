
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { fetchQualifications, deleteQualification } from "@/services/businessFormService";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
    e.stopPropagation(); // Prevent triggering the card click
    
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

  // If there are no previous qualifications, don't show this component
  if (!isLoading && qualifications.length === 0) {
    return null;
  }

  return (
    <div className="w-full text-center">
      <div className="flex justify-center items-center mb-4">
        <h2 className="text-xl font-semibold">Previous Qualifications</h2>
      </div>
      
      <div className="w-full flex justify-center">
        {isLoading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 h-28 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full">
            {qualifications.map((qualification) => (
              <Card 
                key={qualification.id}
                className="p-4 cursor-pointer hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                onClick={() => handleSelect(qualification)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{qualification.company_name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{qualification.industry}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className={`text-lg font-semibold ${
                      qualification.qualification_score >= 80 ? "text-green-500" : 
                      qualification.qualification_score >= 60 ? "text-yellow-500" : "text-red-500"
                    }`}>
                      {qualification.qualification_score}
                    </span>
                    <span className="text-gray-400">/100</span>
                  </div>
                </div>
                
                <div className="flex justify-between mt-4 items-center">
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(qualification.created_at), { addSuffix: true })}
                  </span>
                  
                  <div className="flex space-x-2">
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
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
