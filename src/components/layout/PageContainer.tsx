
import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div 
        className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-25 dark:opacity-20"
        style={{ 
          backgroundImage: `url('/lovable-uploads/80322771-b555-49d5-a822-0953447c6cc4.png')`,
          mixBlendMode: 'multiply', 
          backgroundSize: 'cover' 
        }}
      />
      <div className="container relative py-12 z-10">
        {children}
      </div>
    </div>
  );
}
