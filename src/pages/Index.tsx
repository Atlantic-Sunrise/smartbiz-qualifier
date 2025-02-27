
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/layout/PageContainer";
import { MainContent } from "@/components/dashboard/MainContent";
import { ProfileProvider, useProfile } from "@/context/ProfileContext";

function IndexContent() {
  const navigate = useNavigate();
  const { profile, loading } = useProfile();
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    } else {
      navigate("/auth");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <PageContainer>
      <Header profile={profile} onLogout={handleLogout} />
      <MainContent />
    </PageContainer>
  );
}

const Index = () => {
  return (
    <ProfileProvider>
      <IndexContent />
    </ProfileProvider>
  );
};

export default Index;
