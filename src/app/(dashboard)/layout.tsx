import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AuthGuard } from "@/components/auth-guard";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { WebSocketConnector } from "@/components/websocket-connector";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <WebSocketConnector />
      <KeyboardShortcuts />
      <div className="flex h-screen flex-col md:flex-row">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-4 md:p-6" role="main">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </AuthGuard>
  );
}
