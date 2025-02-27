
import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Base gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"></div>
      
      {/* Overlay image with higher opacity */}
      <img 
        src="/lovable-uploads/80322771-b555-49d5-a822-0953447c6cc4.png"
        className="absolute inset-0 w-full h-full object-cover opacity-40 dark:opacity-30 mix-blend-overlay"
        alt="Background design"
      />
      
      {/* Content container */}
      <div className="container relative py-12 z-10">
        {children}
      </div>
    </div>
  );
}
