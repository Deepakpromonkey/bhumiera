import { Shield, ShieldCheck } from "lucide-react";
import { SignupForm } from "@/components/SignUpForm";

export default function SignupPage() {
    return (
        <div className="min-h-screen flex overflow-hidden">

            {/* ── LEFT: same hero as login ── */}
            <div className="hidden lg:flex lg:w-[58%] relative flex-col justify-end p-14 overflow-hidden"
                 style={{ background: "#0b1520" }}>
                <div className="absolute inset-0"
                     style={{
                         backgroundImage: "url('/images/bhoomi.jpg')",
                         backgroundSize: "cover",
                         backgroundPosition: "center top",
                         opacity: 0.45,
                     }} />
                <div className="absolute inset-0"
                     style={{ background: "linear-gradient(to top, #0b1520 30%, rgba(11,21,32,0.55) 65%, rgba(11,21,32,0.2) 100%)" }} />

                {/* Top-right decorative corner */}
                <div className="absolute top-8 right-8 w-14 h-14 border"
                     style={{ borderColor: "rgba(255,255,255,0.15)" }} />

                <div className="relative z-10">
                    <p className="text-xs font-semibold tracking-[0.22em] uppercase mb-5"
                       style={{ color: "#c9a84c" }}>
                        Pradhan Group Legacy
                    </p>
                    <h1 className="text-white text-[2.7rem] font-bold leading-[1.15] mb-6"
                        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                        Join the Future<br />of Land Ownership.
                    </h1>
                    <p className="text-sm leading-relaxed max-w-md"
                       style={{ color: "rgba(255,255,255,0.5)" }}>
                        Register your institutional account to access the Bhoomi Era
                        backbone and manage land portfolios with precision and security.
                    </p>
                </div>
            </div>

            {/* ── RIGHT: signup panel ── */}
            <div className="flex-1 flex flex-col items-center justify-center px-10 py-12 relative overflow-y-auto"
                 style={{ background: "#f9f7f3" }}>

                {/* Brand */}
                <div className="flex flex-col items-center mb-8 w-full max-w-md">
                    <div className="flex items-center gap-3 mb-3">
                        <Shield size={26} strokeWidth={1.8} style={{ color: "#c9a84c" }} />
                        <span className="text-[22px] font-bold tracking-[0.18em] uppercase"
                              style={{ color: "#1a2d4a", fontFamily: "Georgia, 'Times New Roman', serif" }}>
                            Bhoomi Era
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border"
                         style={{ background: "#f0ece4", borderColor: "#ddd5c0" }}>
                        <ShieldCheck size={11} style={{ color: "#c9a84c" }} />
                        <span className="text-[9px] font-bold tracking-[0.22em] uppercase"
                              style={{ color: "#6b5e3f" }}>
                            Create Account
                        </span>
                    </div>
                </div>

                {/* Form card */}
                <div className="w-full max-w-md rounded-2xl border p-8 shadow-sm"
                     style={{ background: "#ffffff", borderColor: "#e8e2d8" }}>
                    <SignupForm />
                </div>

                {/* Footer */}
                <div className="w-full max-w-md mt-8 text-center space-y-2">
                    <p className="text-xs italic leading-relaxed" style={{ color: "#9a8e7a" }}>
                        "This is a restricted institutional portal. Unauthorized access
                        is strictly prohibited and monitored."
                    </p>
                    <div className="flex items-center justify-center gap-6 text-[10px] font-medium pt-1"
                         style={{ color: "#b0a080" }}>
                        <span>© 2026 Pradhan Group Legacy</span>
                        <span>SECURE NODE: 771-X</span>
                    </div>
                </div>

            </div>
        </div>
    );
}