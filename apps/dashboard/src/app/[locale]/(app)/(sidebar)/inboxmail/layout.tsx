import { AppSidebar } from "@/components/inbox/ui/app-sidebar";
import { SidebarProvider } from "@/components/inbox/ui/sidebar";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
    <SidebarProvider>
    <div className="flex h-screen w-screen overflow-hidden">
      <AppSidebar />
      {children}
    </div>
    </SidebarProvider>
    </>
  );
}
