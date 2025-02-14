import { AppSidebar } from "@/components/inbox/ui/app-sidebar";
import { SidebarProvider } from "@/components/inbox/ui/sidebar";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
 
    <div className="flex h-screen w-screen overflow-hidden">
      {/* <AppSidebar /> */}
      {children}
    </div>
  );
}
