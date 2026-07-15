import { RequireAuth } from "@/components/layout/RequireAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="flex h-screen overflow-hidden bg-cloud">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">{children}</main>
        </div>
      </div>
    </RequireAuth>
  );
}
