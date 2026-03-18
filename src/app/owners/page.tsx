"use client";

import { DashboardShell } from "@/components/DashboardShell";
import { Users } from "lucide-react";

export default function OwnersPage() {
  return (
    <DashboardShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="p-6 rounded-3xl bg-primary/10 text-primary glass animate-pulse">
          <Users className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold text-white">Owners Management</h1>
        <p className="text-white/40 max-w-md">This module is currently under development. Here you will be able to manage vehicle owners and their profiles.</p>
      </div>
    </DashboardShell>
  );
}
