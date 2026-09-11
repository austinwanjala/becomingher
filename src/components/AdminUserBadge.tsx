'use client';

import { ShieldCheck, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { performClientSignOut } from '@/lib/auth/session';

interface AdminUserBadgeProps {
  email: string;
  name: string;
  role?: string;
}

export function AdminUserBadge({ email, name, role = 'ADMIN' }: AdminUserBadgeProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await performClientSignOut('/admin/login?message=' + encodeURIComponent('You have been securely signed out of the Administrative Console.'));
  };

  const formattedRole = role.replace('_', ' ');

  return (
    <div className="p-3 mx-4 my-3 rounded-2xl bg-stone-50 border border-stone-200/90 shadow-xs flex items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-xl bg-rose-950 text-amber-200 flex items-center justify-center shrink-0 font-serif font-bold text-xs shadow-xs">
          {name.slice(0, 1).toUpperCase()}
        </div>
        <div className="truncate">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-stone-900 truncate leading-tight">{name}</p>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold tracking-wide uppercase">
              {formattedRole}
            </span>
          </div>
          <p className="text-[10px] text-stone-500 truncate">{email}</p>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        title="Sign Out of Admin Console"
        className="w-7 h-7 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-800 transition flex items-center justify-center shrink-0"
      >
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
