"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { ToastContainer } from "@/components/ui/Toast";  // ← mount once here

export default function BhoomiLayout({ children }) {
    return (
        <div className="flex h-screen w-full overflow-hidden" style={{ background: "#f5f2ed" }}>

            <Sidebar />

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <Topbar />
                <main className="flex-1 overflow-y-auto p-6" style={{ background: "#f5f2ed" }}>
                    {children}
                </main>
            </div>

            {/* Single toast container for all pages */}
            <ToastContainer />
        </div>
    );
}