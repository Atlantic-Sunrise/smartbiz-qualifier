
import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div 
        className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=2400&q=80')] opacity-5 bg-cover bg-center pointer-events-none"
        style={{ mixBlendMode: 'overlay' }}
      />
      <div className="container relative py-12 z-10">
        {children}
      </div>
    </div>
  );
}
