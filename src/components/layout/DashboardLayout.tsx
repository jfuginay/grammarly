import React, { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface DashboardLayoutProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
}

const DashboardLayout = ({ sidebar, header, children }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        {sidebar}
      </div>

      {/* Mobile sidebar */}
      <div className="md:hidden">
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetContent side="left" className="p-0 w-72">
            {sidebar}
          </SheetContent>
        </Sheet>
      </div>
      
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Pass the toggle function to the header */}
        {React.cloneElement(header as React.ReactElement, { onMenuClick: () => setIsSidebarOpen(true) })}
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout; 