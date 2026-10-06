'use client';
import { usePathname } from 'next/navigation';
import { Bell, Command } from 'lucide-react';

interface NavbarProps {
  currentSection?: string;
  version?: string;
}

export function Navbar({ currentSection, version = 'v2.18.4' }: NavbarProps) {
  const pathname = usePathname();

  // Determine section breadcrumb from path or prop
  const getBreadcrumb = () => {
    if (currentSection) return currentSection.toUpperCase();
    if (pathname === '/dashboard' || pathname === '/' || pathname === '') return 'OVERVIEW';
    if (pathname.startsWith('/orgs')) return 'ORGANIZATIONS';
    if (pathname.startsWith('/users')) return 'PLATFORM USERS';
    if (pathname.startsWith('/audit')) return 'AUDIT LOG';
    if (pathname.startsWith('/system')) return 'SYSTEM';
    if (pathname.startsWith('/settings')) return 'SETTINGS';
    return pathname.replace('/', '').toUpperCase();
  };

  return (
    <header className="h-14 w-full bg-[#080C14] border-b border-[#1A2234] flex items-center justify-between px-4 sticky top-0 z-40 select-none">
      {/* Left: Brand + Breadcrumb */}
      <div className="flex items-center h-full">
        {/* Brand Block */}
        <div className="flex items-center gap-3 pr-6 border-r border-[#1A2234] h-full">
          {/* EC Orange Logo Box */}
          <div className="w-8 h-8 rounded-md bg-[#F59E0B] flex items-center justify-center font-bold text-black text-sm tracking-tight shadow-sm">
            EC
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white tracking-tight leading-none">
              EbenchCampus
            </span>
            <span className="text-[9px] font-mono tracking-widest text-[#7E8B9F] uppercase leading-none mt-1">
              PLATFORM OWNER
            </span>
          </div>
        </div>

        {/* Monospace Path Breadcrumb */}
        <div className="pl-6 flex items-center gap-2 text-xs font-mono tracking-widest text-[#8F9CAE]">
          <span className="text-[#64748B]">PLATFORM</span>
          <span className="text-[#3B4861]">/</span>
          <span className="text-[#CBD5E1] font-medium">{getBreadcrumb()}</span>
        </div>
      </div>

      {/* Right: Meta Status, Version & Quick Controls */}
      <div className="flex items-center gap-4 text-[#8F9CAE]">
        <div className="text-xs font-mono tracking-wider text-[#64748B] hidden sm:block">
          UTC · {version}
        </div>

        {/* Command shortcut icon */}
        <button
          type="button"
          title="Command Palette"
          className="w-7 h-7 rounded flex items-center justify-center hover:bg-[#151D2C] hover:text-white transition-colors text-[#8F9CAE]"
        >
          <Command className="w-4 h-4" />
        </button>

        {/* Notification Bell */}
        <button
          type="button"
          title="Notifications"
          className="w-7 h-7 rounded flex items-center justify-center hover:bg-[#151D2C] hover:text-white transition-colors text-[#8F9CAE] relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#F59E0B] rounded-full" />
        </button>
      </div>
    </header>
  );
}
