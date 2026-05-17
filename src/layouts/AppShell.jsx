import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';

export const AppShell = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-page-radial px-4 py-4 md:px-6">
      <div className="mx-auto grid max-w-[1600px] gap-4 md:grid-cols-[290px_minmax(0,1fr)]">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex min-w-0 flex-col gap-4">
          <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
          <main className="animate-fade-up">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
