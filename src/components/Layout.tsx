import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  GraduationCap, LayoutDashboard, Building2, Award, Calculator,
  Lightbulb, MessageSquare, User, LogOut, Menu,
  ChevronLeft, Shield, Upload, Bell, GitCompare, BarChart3,
  Headphones, Megaphone, Database, Languages,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function NavItem({ href, label, icon: Icon, onClick }: { href: string; label: string; icon: any; onClick?: () => void }) {
  const [location] = useLocation();
  const active = location === href || (href !== "/dashboard" && href !== "/admin" && location.startsWith(href));
  return (
    <Link href={href} onClick={onClick}>
      <div
        data-testid={`nav-${href.replace(/\//g, "-")}`}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer",
          active
            ? "bg-white/20 text-white"
            : "text-white/75 hover:bg-white/10 hover:text-white"
        )}
      >
        <Icon size={18} />
        <span>{label}</span>
      </div>
    </Link>
  );
}

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const { currentUser, isAdmin, signOut } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const studentNav = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/universities", label: t("nav.universities"), icon: Building2 },
    { href: "/scholarships", label: t("nav.scholarships"), icon: Award },
    { href: "/compare", label: t("nav.compare"), icon: GitCompare },
    { href: "/calculator", label: t("nav.calculator"), icon: Calculator },
    { href: "/recommendations", label: t("nav.recommendations"), icon: Lightbulb },
    { href: "/ai-chat", label: t("nav.aiChat"), icon: MessageSquare },
  ];

  const adminNav = [
    { href: "/admin", label: t("nav.adminDashboard"), icon: Shield },
    { href: "/admin/universities", label: t("nav.adminUniversities"), icon: Building2 },
    { href: "/admin/scholarships", label: t("nav.adminScholarships"), icon: Award },
    { href: "/admin/importer", label: t("nav.adminImporter"), icon: Upload },
    { href: "/admin/seeder", label: t("nav.adminSeeder"), icon: Database },
    { href: "/admin/data-quality", label: t("nav.adminDataQuality"), icon: BarChart3 },
    { href: "/admin/announcements", label: t("nav.adminAnnouncements"), icon: Megaphone },
    { href: "/admin/support", label: t("nav.adminSupport"), icon: Headphones },
  ];

  const handleSignOut = async () => { await signOut(); };
  const initials = currentUser?.email?.charAt(0).toUpperCase() ?? "م";
  const toggleLang = () => setLang(lang === "ar" ? "en" : "ar");

  const sidebar = (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
          <GraduationCap size={20} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-lg leading-none">{t("app.name")}</p>
          <p className="text-white/60 text-xs mt-0.5">{t("app.tagline")}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-white/40 text-xs font-medium px-4 pb-2 pt-1">
          {lang === "ar" ? "القائمة الرئيسية" : "Main Menu"}
        </p>
        {studentNav.map((item) => (
          <NavItem key={item.href} {...item} onClick={() => setSidebarOpen(false)} />
        ))}

        {isAdmin && (
          <>
            <div className="border-t border-white/10 my-3" />
            <p className="text-white/40 text-xs font-medium px-4 pb-2">{t("common.admin")}</p>
            {adminNav.map((item) => (
              <NavItem key={item.href} {...item} onClick={() => setSidebarOpen(false)} />
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3">
        <Link href="/profile">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors">
            <Avatar className="w-8 h-8 bg-white/20">
              <AvatarFallback className="bg-white/20 text-white text-sm">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{currentUser?.email}</p>
              <p className="text-white/50 text-xs">{isAdmin ? t("common.admin") : t("common.student")}</p>
            </div>
          </div>
        </Link>
        <button
          onClick={handleSignOut}
          data-testid="button-signout"
          className="w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm"
        >
          <LogOut size={16} />
          <span>{t("nav.signOut")}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col flex-shrink-0">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute right-0 top-0 bottom-0 w-64 flex flex-col">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-white flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setSidebarOpen(true)}
              data-testid="button-menu"
            >
              <Menu size={20} />
            </button>
            {title && <h1 className="font-semibold text-foreground">{title}</h1>}
          </div>
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors text-xs font-medium text-muted-foreground border border-border"
              title={lang === "ar" ? "Switch to English" : "التبديل للعربية"}
            >
              <Languages size={14} />
              {lang === "ar" ? "EN" : "عر"}
            </button>

            <button className="p-1.5 rounded-lg hover:bg-muted transition-colors relative" data-testid="button-notifications">
              <Bell size={18} className="text-muted-foreground" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted transition-colors" data-testid="button-user-menu">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <ChevronLeft size={14} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <span className="flex items-center gap-2 w-full cursor-pointer">
                      <User size={14} />{t("nav.profile")}
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                  <LogOut size={14} className="ml-2" />
                  {t("nav.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
