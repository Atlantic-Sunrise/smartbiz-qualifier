
import { useState, useEffect } from "react";
import { fetchQualifications, deleteQualification } from "@/services/businessFormService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Eye, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

export function PreviousQualifications({ onSelectResult }: { onSelectResult: (result: any) => void }) {
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadQualifications();
  }, []);

  const loadQualifications = async () => {
    try {
      setLoading(true);
      const data = await fetchQualifications();
      setQualifications(data);
    } catch (error) {
      console.error("Error loading qualifications:", error);
      toast({
        title: "Error",
        description: "Could not load previous qualifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteQualification(id);
      
      // Remove the deleted qualification from the state
      setQualifications(qualifications.filter(qual => qual.id !== id));
      
      toast({
        title: "Success",
        description: "Qualification deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting qualification:", error);
      toast({
        title: "Error",
        description: "Could not delete qualification",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getBadgeVariant = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
    if (score >= 60) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "High Potential";
    if (score >= 60) return "Medium Potential";
    return "Low Potential";
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  // Display all or just the first 3
  const displayQualifications = showAll 
    ? qualifications 
    : qualifications.slice(0, 3);
  
  if (loading) {
    return (
      <Card className="p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Previous Qualifications</h3>
        <div className="text-center py-4">Loading previous qualifications...</div>
      </Card>
    );
  }

  if (qualifications.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 mb-8">
      <h3 className="text-lg font-semibold mb-4">Previous Qualifications</h3>
      <div className="space-y-4">
        {displayQualifications.map((qual) => (
          <div 
            key={qual.id} 
            className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div>
              <h4 className="font-medium">{qual.company_name}</h4>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {qual.industry} • {formatDate(qual.created_at)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getBadgeVariant(qual.qualification_score)}>
                {qual.qualification_score}/100 - {getScoreLabel(qual.qualification_score)}
              </Badge>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onSelectResult({
                  score: qual.qualification_score,
                  summary: qual.qualification_summary,
                  insights: qual.qualification_insights,
                  recommendations: qual.qualification_recommendations
                })}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                disabled={deletingId === qual.id}
                onClick={() => handleDelete(qual.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {qualifications.length > 3 && (
        <Button 
          variant="ghost" 
          className="w-full mt-4" 
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Show All ({qualifications.length})
            </>
          )}
        </Button>
      )}
    </Card>
  );
}
