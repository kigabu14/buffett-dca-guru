import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';

export const DashboardLayout = () => {
  return (
    <div className="h-screen flex">
      <Sidebar className="w-64 flex-shrink-0" />
      <main className="flex-1 overflow-auto bg-background">
        <Outlet />
      </main>
    </div>
  );
};