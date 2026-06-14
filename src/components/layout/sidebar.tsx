"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Handshake,
  Building2,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  FileText,
  Megaphone,
  BookOpen,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/lib/database.types";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/influenceurs", label: "Influenceurs", icon: Users },
  { href: "/dashboard/catalogue", label: "Catalogue", icon: BookOpen },
  { href: "/dashboard/campagnes", label: "Campagnes", icon: TrendingUp },
  { href: "/dashboard/partenaires", label: "Tableaux partenaires", icon: Megaphone },
  { href: "/dashboard/collaborations", label: "Collaborations", icon: Handshake },
  { href: "/dashboard/marques", label: "Marques", icon: Building2 },
  { href: "/dashboard/facturation", label: "Facturation", icon: FileText },
  { href: "/dashboard/calendrier", label: "Calendrier", icon: Calendar },
];

export function Sidebar({ profile, email }: { profile: Profile | null; email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isAdmin = profile?.role === "admin";

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-full glass-strong"
        aria-label="Menu"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-[260px] glass-strong border-r flex flex-col transition-transform",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo Mood Agency */}
        <div className="p-6 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full gradient-mood flex items-center justify-center glow-primary">
              <span className="text-white font-black text-lg leading-none">m</span>
            </div>
            <div>
              <div className="font-bold text-white leading-none text-lg tracking-tight">
                mood<span className="text-white/40 font-normal italic ml-0.5">agency</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 mt-1 font-semibold">CRM</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-semibold transition-all",
                  active ? "text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-full gradient-mood -z-10 shadow-lg shadow-orange-600/30"
                    transition={{ type: "spring", duration: 0.4 }}
                  />
                )}
                <Icon className={cn("w-4 h-4")} />
                {item.label}
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              href="/dashboard/parametres"
              onClick={() => setOpen(false)}
              className={cn(
                "relative flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-semibold transition-all mt-4",
                pathname.startsWith("/dashboard/parametres")
                  ? "text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              {pathname.startsWith("/dashboard/parametres") && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-full gradient-mood -z-10 shadow-lg shadow-orange-600/30"
                />
              )}
              <Settings className="w-4 h-4" />
              Paramètres
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-white/8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full gradient-mood flex items-center justify-center text-white font-bold text-sm shrink-0">
              {(profile?.full_name || email).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{profile?.full_name || email.split("@")[0]}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <Badge variant={isAdmin ? "primary" : "muted"} className="text-[10px] px-1.5 py-0">
                  {isAdmin ? "Admin" : "Manager"}
                </Badge>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-full text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}
