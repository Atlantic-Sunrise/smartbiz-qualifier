
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Eye, FileDown, RefreshCw } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { fetchQualifications, deleteQualification, updateQualification } from "@/services/businessFormService";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EMPLOYEE_RANGES, REVENUE_RANGES, TOP_INDUSTRIES } from "@/constants/businessFormConstants";
import { Badge } from "@/components/ui/badge";

interface PreviousQualificationsProps {
  onSelectResult: (results: any, companyName: string) => void;
}

export function PreviousQualifications({ onSelectResult }: PreviousQualificationsProps) {
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [qualificationToDelete, setQualificationToDelete] = useState<string | null>(null);
  const [qualificationToUpdate, setQualificationToUpdate] = useState<any | null>(null);
  const [updateFormData, setUpdateFormData] = useState({
    companyName: "",
    industry: "",
    employeeCount: "",
    annualRevenue: "",
    website: "",
    challenges: ""
  });
  const { toast } = useToast();

  const loadQualifications = async () => {
    setIsLoading(true);
    try {
      const data = await fetchQualifications();
      
      // Mark rescored entries
      if (data && data.length > 0) {
        // Group by company name
        const companyGroups: Record<string, any[]> = {};
        data.forEach(qual => {
          const companyName = qual.company_name;
          if (!companyGroups[companyName]) {
            companyGroups[companyName] = [];
          }
          companyGroups[companyName].push(qual);
        });
        
        // For each company with multiple entries, mark rescored ones
        Object.values(companyGroups).forEach(group => {
          if (group.length > 1) {
            // Sort by date ascending to find the original (oldest)
            group.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            
            // Mark all but the first (oldest) as rescored
            for (let i = 1; i < group.length; i++) {
              group[i].is_rescored = true;
            }
          }
        });
      }
      
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

  const handleUpdateClick = (qualification: any) => {
    setQualificationToUpdate(qualification);
    setUpdateFormData({
      companyName: qualification.company_name || "",
      industry: qualification.industry || "",
      employeeCount: qualification.employee_count || "",
      annualRevenue: qualification.annual_revenue || "",
      website: qualification.website || "",
      challenges: qualification.challenges || ""
    });
    setUpdateDialogOpen(true);
  };

  const handleUpdateSubmit = async () => {
    if (!qualificationToUpdate) return;

    setIsUpdating(true);
    try {
      await updateQualification(qualificationToUpdate.id, updateFormData);
      toast({
        title: "Qualification Updated",
        description: "The lead has been successfully rescored with the updated information.",
      });
      setUpdateDialogOpen(false);
      loadQualifications();
    } catch (error) {
      console.error("Error updating qualification:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update qualification. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
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

  const handleDownloadCSV = () => {
    setIsExporting(true);
    try {
      // Get column headers
      const headers = [
        "Company Name",
        "Industry",
        "Key Need",
        "Score",
        "Employee Count",
        "Annual Revenue",
        "Date Added"
      ];
      
      // Format the data
      const rows = qualifications.map(qual => [
        qual.company_name || "",
        qual.industry || "",
        qual.key_need || extractKeyNeed(qual),
        qual.qualification_score?.toString() || "0",
        qual.employee_count || "",
        qual.annual_revenue || "",
        new Date(qual.created_at).toLocaleDateString()
      ]);
      
      // Combine headers and rows
      const csvContent = [
        headers.join(","),
        ...rows.map(row => 
          // Escape cells that might contain commas
          row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(",")
        )
      ].join("\n");
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "lead-qualifications-summary.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "CSV Downloaded",
        description: "Lead qualifications summary has been downloaded as CSV",
      });
    } catch (error) {
      console.error("Error downloading CSV:", error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Failed to generate CSV file. Please try again.",
      });
    } finally {
      setIsExporting(false);
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
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {qual.company_name}
                            {qual.is_rescored && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                Updated
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{qual.industry}</TableCell>
                        <TableCell>{qual.key_need || extractKeyNeed(qual)}</TableCell>
                        <TableCell>{qual.qualification_score}/100</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleView(qual)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => handleUpdateClick(qual)}>
                              <RefreshCw className="h-4 w-4" />
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
                  onClick={handleDownloadCSV}
                  disabled={isExporting}
                  className="w-full max-w-2xl bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-800 dark:hover:to-gray-900 dark:text-white transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <FileDown className="h-4 w-4 animate-pulse" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <FileDown className="h-4 w-4" />
                      Download Summary CSV
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

      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Lead Information</DialogTitle>
            <DialogDescription>
              Update the information below to rescore this lead. A new qualification will be created with the updated data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="update-company">Company Name</Label>
              <Input
                id="update-company"
                value={updateFormData.companyName}
                onChange={(e) => setUpdateFormData({...updateFormData, companyName: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="update-industry">Industry</Label>
              <Select 
                value={updateFormData.industry} 
                onValueChange={(value) => setUpdateFormData({...updateFormData, industry: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {TOP_INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="update-employees">Number of Employees</Label>
              <Select 
                value={updateFormData.employeeCount} 
                onValueChange={(value) => setUpdateFormData({...updateFormData, employeeCount: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee range" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_RANGES.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="update-revenue">Annual Revenue</Label>
              <Select 
                value={updateFormData.annualRevenue} 
                onValueChange={(value) => setUpdateFormData({...updateFormData, annualRevenue: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select revenue range" />
                </SelectTrigger>
                <SelectContent>
                  {REVENUE_RANGES.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="update-website">Website</Label>
              <Input
                id="update-website"
                value={updateFormData.website}
                onChange={(e) => setUpdateFormData({...updateFormData, website: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="update-challenges">Business Challenges</Label>
              <textarea
                id="update-challenges"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={updateFormData.challenges}
                onChange={(e) => setUpdateFormData({...updateFormData, challenges: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={handleUpdateSubmit}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update & Rescore"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
