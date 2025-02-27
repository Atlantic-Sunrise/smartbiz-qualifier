
import { useState, useEffect } from "react";
import { fetchQualifications, deleteQualification } from "@/services/businessFormService";
import { formatDistanceToNow } from "date-fns";
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

  // If there are no previous qualifications, don't show this component
  if (!isLoading && qualifications.length === 0) {
    return null;
  }

  // Always display the two most recent qualifications
  const recentQualifications = qualifications.slice(0, 2);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-center">Lead Qualifications</h2>
      </div>
      
      <div className="w-full">
        {isLoading ? (
          <div className="h-20 animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
        ) : (
          <div className="border rounded-md">
            {/* Force table to have a minimum width that requires scrolling */}
            <div className="overflow-x-auto">
              <div style={{ minWidth: '800px' }}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead style={{ width: '200px' }}>Company</TableHead>
                      <TableHead style={{ width: '150px' }}>Industry</TableHead>
                      <TableHead style={{ width: '150px' }}>Revenue</TableHead>
                      <TableHead style={{ width: '100px' }}>Score</TableHead>
                      <TableHead style={{ width: '150px' }}>Time</TableHead>
                      <TableHead style={{ width: '100px' }} className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentQualifications.map((qualification) => (
                      <TableRow
                        key={qualification.id}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => handleSelect(qualification)}
                      >
                        <TableCell className="font-medium truncate">{qualification.company_name}</TableCell>
                        <TableCell className="truncate">{qualification.industry}</TableCell>
                        <TableCell className="truncate">{qualification.annual_revenue}</TableCell>
                        <TableCell>
                          <span className={`font-semibold ${
                            qualification.qualification_score >= 80 ? "text-green-500" : 
                            qualification.qualification_score >= 60 ? "text-yellow-500" : "text-red-500"
                          }`}>
                            {qualification.qualification_score}/100
                          </span>
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(qualification.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-right">
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
            
            {/* Pagination indicators to show there are more leads */}
            {qualifications.length > 2 && (
              <div className="flex justify-center mt-2 mb-2 gap-1">
                {qualifications.map((_, index) => (
                  <div 
                    key={index} 
                    className={`h-1.5 rounded-full ${
                      index < 2 ? 'w-4 bg-gray-400' : 'w-2 bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
