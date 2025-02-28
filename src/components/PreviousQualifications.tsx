
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Eye, Mail, FileText } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { fetchQualifications, deleteQualification } from "@/services/businessFormService";
import { sendMultipleQualificationsSummary } from "@/services/emailService";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PreviousQualificationsProps {
  onSelectResult: (results: any, companyName: string) => void;
}

export function PreviousQualifications({ onSelectResult }: PreviousQualificationsProps) {
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingDetailed, setIsSendingDetailed] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [qualificationToDelete, setQualificationToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const loadQualifications = async () => {
    setIsLoading(true);
    try {
      const data = await fetchQualifications();
      setQualifications(data || []);
    } catch (error) {
      console.error("Error loading qualifications:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load previous qualifications. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQualifications();
  }, []);

  const confirmDelete = (id: string) => {
    setQualificationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!qualificationToDelete) return;
    
    try {
      await deleteQualification(qualificationToDelete);
      toast({
        title: "Qualification Deleted",
        description: "The qualification has been successfully removed.",
      });
      loadQualifications();
    } catch (error) {
      console.error("Error deleting qualification:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete qualification. Please try again.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setQualificationToDelete(null);
    }
  };

  const handleView = (qualification: any) => {
    const results = {
      score: qualification.qualification_score,
      summary: qualification.qualification_summary,
      insights: qualification.qualification_insights,
      recommendations: qualification.qualification_recommendations,
    };
    onSelectResult(results, qualification.company_name);
  };

  // Function to extract the key need
  const extractKeyNeed = (qualification: any): string => {
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

    // Combine all text data for analysis
    const text = (qualification.qualification_summary || "") + " " + 
                (qualification.qualification_insights || []).join(" ") + " " + 
                (qualification.qualification_recommendations || []).join(" ") + " " +
                (qualification.challenges || "");
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

  const handleSendAllSummaries = async (includeDetails: boolean) => {
    try {
      if (includeDetails) {
        setIsSendingDetailed(true);
      } else {
        setIsSendingEmail(true);
      }
      
      // Get current user's email
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !user.email) {
        throw new Error("User email not found. Please ensure you're logged in.");
      }
      
      if (!qualifications || qualifications.length === 0) {
        throw new Error("No qualifications available to send.");
      }
      
      // Prepare the data for all qualifications
      const allQualifications = qualifications.map(qual => ({
        businessName: qual.company_name,
        score: qual.qualification_score,
        summary: qual.qualification_summary,
        insights: qual.qualification_insights,
        recommendations: qual.qualification_recommendations,
        industry: qual.industry,
        annualRevenue: qual.annual_revenue,
        createdAt: qual.created_at,
        keyNeed: qual.key_need || extractKeyNeed(qual)
      }));
      
      // Send the email
      await sendMultipleQualificationsSummary({
        email: user.email,
        qualifications: allQualifications,
        includeDetails
      });
      
      toast({
        title: "Summary Sent",
        description: `${includeDetails ? 'Detailed reports' : 'Summary'} has been sent to ${user.email}`,
      });
    } catch (error) {
      console.error("Error sending summaries:", error);
      toast({
        title: "Email Failed",
        description: error instanceof Error ? error.message : "Failed to send summary email. Please try again.",
        variant: "destructive",
      });
    } finally {
      if (includeDetails) {
        setIsSendingDetailed(false);
      } else {
        setIsSendingEmail(false);
      }
    }
  };

  if (qualifications.length === 0 && !isLoading) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Previous Lead Qualifications</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-6">Loading previous qualifications...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Key Need</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {qualifications.map((qual) => (
                      <TableRow key={qual.id}>
                        <TableCell className="font-medium">{qual.company_name}</TableCell>
                        <TableCell>{qual.industry}</TableCell>
                        <TableCell>{qual.key_need || extractKeyNeed(qual)}</TableCell>
                        <TableCell>{qual.qualification_score}/100</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleView(qual)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => confirmDelete(qual.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col items-center w-full mt-8 space-y-4">
                <Button 
                  onClick={() => handleSendAllSummaries(false)}
                  disabled={isSendingEmail}
                  className="w-full max-w-2xl bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-800 dark:hover:to-gray-900 dark:text-white transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {isSendingEmail ? (
                    <>
                      <Mail className="h-4 w-4 animate-pulse" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Email Summary Table
                    </>
                  )}
                </Button>

                <Button 
                  onClick={() => handleSendAllSummaries(true)}
                  disabled={isSendingDetailed}
                  className="w-full max-w-2xl bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-800 dark:hover:to-gray-900 dark:text-white transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {isSendingDetailed ? (
                    <>
                      <FileText className="h-4 w-4 animate-pulse" />
                      Sending Detailed Reports...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Send Detailed Reports
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this lead qualification. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
