"use client";

import { DashboardShell } from "@/components/DashboardShell";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <DashboardShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="p-6 rounded-3xl bg-primary/10 text-primary glass animate-pulse">
          <Settings className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold text-white">System Settings</h1>
        <p className="text-white/40 max-w-md">This module is currently under development. Customize your dashboard and fleet management preferences here.</p>
      </div>
    </DashboardShell>
  );
}
