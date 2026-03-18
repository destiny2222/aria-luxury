"use client";

import { Search, Bell, User, Menu } from "lucide-react";

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="fixed top-0 left-0 right-0 lg:left-64 h-20 glass-header z-40 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4 lg:gap-0">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl glass hover:text-primary transition-all"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="w-48 sm:w-96 group hidden sm:block">
          <input 
            type="text" 
            placeholder="Search..."
            className="w-full bg-white/5 border border-white/5 rounded-xl py-2 px-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all font-medium"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <button className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all">
          <Bell className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white">Alex Rivera</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Fleet Admin</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-secondary p-px">
            <div className="w-full h-full rounded-full bg-[#050505] flex items-center justify-center overflow-hidden">
               <User className="text-white/40 w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
