import { Shield, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex overflow-hidden">

            <div className="hidden lg:flex lg:w-[58%] relative flex-col justify-end p-14 overflow-hidden" style={{ background: "#0b1520" }}>
                {/* Building photo */}
                <div className="absolute inset-0"
                    style={{
                        backgroundImage: "url('/images/bhoomi.jpg')",
                        backgroundSize: "cover",
                        backgroundPosition: "center top",
                        opacity: 0.45,
                    }}
                />

                {/* Gradient vignette: dark at bottom, transparent at top */}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #0b1520 30%, rgba(11,21,32,0.55) 65%, rgba(11,21,32,0.2) 100%)", }}/>


                {/* Bottom-left content */}
                <div className="relative z-10">

                    <p className="text-xs font-semibold tracking-[0.22em] uppercase mb-5" style={{ color: "#c9a84c" }}>
                        Pradhan Group Legacy
                    </p>
                    <h1 className="text-white text-[2.7rem] font-bold leading-[1.15] mb-6"  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                        Securing the Future<br />of Land Ownership.
                    </h1>
                    <p className="text-sm leading-relaxed max-w-md" style={{ color: "rgba(255,255,255,0.5)" }}>
                        Accessing the Bhoomi Era institutional backbone. Our architectural
                        precision meets modern digital security to protect the region's most
                        valuable assets.
                    </p>

                </div>

            </div>



            <div
                className="flex-1 flex flex-col items-center justify-center px-10 py-12 relative overflow-y-auto"
                style={{ background: "#f9f7f3" }}
            >

                {/* Brand header */}
                <div className="flex flex-col items-center mb-10 w-full max-w-md">
                    <div className="flex items-center gap-3 mb-3">

                        <Shield size={26} strokeWidth={1.8} style={{ color: "#c9a84c" }}/>

                        <span className="text-[22px] font-bold tracking-[0.18em] uppercase"
                            style={{
                                color: "#1a2d4a",
                                fontFamily: "Georgia, 'Times New Roman', serif",
                                letterSpacing: "0.18em",
                            }}
                        >
                            Bhoomi Era
                        </span>
                    </div>

                    {/* Portal badge */}
                    <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border" style={{ background: "#f0ece4", borderColor: "#ddd5c0" }}>
                        <ShieldCheck size={11} style={{ color: "#c9a84c" }} />
                        <span className="text-[9px] font-bold tracking-[0.22em] uppercase" style={{ color: "#6b5e3f" }}>
                            Super Admin Portal
                        </span>
                    </div>
                </div>

                {/* Form card */}
                <div className="w-full max-w-md rounded-2xl border p-8 shadow-sm" style={{ background: "#ffffff", borderColor: "#e8e2d8" }} >
                    <LoginForm />
                </div>

                {/* Restricted notice */}
                <div className="w-full max-w-md mt-8 text-center space-y-2">
                    <p className="text-xs italic leading-relaxed" style={{ color: "#9a8e7a" }}>
                        "This is a restricted institutional portal. Unauthorized access
                        is strictly prohibited and monitored."
                    </p>
                    <div className="flex items-center justify-center gap-6 text-[10px] font-medium pt-1" style={{ color: "#b0a080" }}>
                        <span>© 2026 Pradhan Group Legacy</span>
                        <span>SECURE NODE: 771-X</span>
                    </div>
                </div>

            </div>

        </div>
    );
}