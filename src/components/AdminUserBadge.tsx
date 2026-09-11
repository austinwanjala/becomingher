'use client';

import { ShieldCheck, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface AdminUserBadgeProps {
  email: string;
  name: string;
}

export function AdminUserBadge({ email, name }: AdminUserBadgeProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login?message=' + encodeURIComponent('You have been securely signed out of the Administrative Console.'));
    router.refresh();
  };

  return (
    <div className="p-3 mx-4 my-3 rounded-2xl bg-stone-50 border border-stone-200/90 shadow-xs flex items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-xl bg-rose-950 text-amber-200 flex items-center justify-center shrink-0 font-serif font-bold text-xs shadow-xs">
          {name.slice(0, 1).toUpperCase()}
        </div>
        <div className="truncate">
          <p className="font-semibold text-stone-900 truncate leading-tight">{name}</p>
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
