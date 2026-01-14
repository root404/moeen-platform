'use client';

import React from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">مُعين Admin</h1>
          </div>
        </div>
      </div>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}