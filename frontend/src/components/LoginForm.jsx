"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AtSign, Loader2, ShieldCheck } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { toast, ToastContainer } from "@/components/ui/Toast";

export function LoginForm() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [email,        setEmail]        = useState("");
    const [password,     setPassword]     = useState("");
    const [remember,     setRemember]     = useState(false);
    const [isLoading,    setIsLoading]    = useState(false);
    const [fieldErrors,  setFieldErrors]  = useState({ email: false, password: false });

    async function handleLogin(e) {
        e.preventDefault();
        setIsLoading(true);
        setFieldErrors({ email: false, password: false });

        if (!email.trim()) {
            setFieldErrors(f => ({ ...f, email: true }));
            toast.error({ title: "Email required", message: "Please enter your institutional ID or email." });
            setIsLoading(false);
            return;
        }
        if (!password) {
            setFieldErrors(f => ({ ...f, password: true }));
            toast.error({ title: "Password required", message: "Please enter your security password." });
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/auth/login`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setFieldErrors({ email: true, password: true });
                throw new Error(data.message || "Invalid credentials. Please try again.");
            }

            if (data.token) {
                localStorage.setItem("crm_auth_token", data.token);
                document.cookie = [
                    `crm_auth_token=${data.token}`,
                    "path=/",
                    `max-age=${60 * 60 * 24 * 7}`,
                    "SameSite=Lax",
                ].join("; ");
            }

            if (data.user) localStorage.setItem("crm_user", JSON.stringify(data.user));

            toast.success({
                title:    "Access Granted",
                message:  "Welcome back. Redirecting to archive...",
                duration: 2500,
            });

            setTimeout(() => {
                const params = new URLSearchParams(window.location.search);
                const from   = params.get("from") || "/bhoomi/dashboard";
                router.push(from);
            }, 900);

        } catch (err) {
            toast.error({ title: "Authentication Failed", message: err.message, duration: 6000 });
        } finally {
            setIsLoading(false);
        }
    }

    function bc(key)         { return fieldErrors[key] ? "#ef4444" : "#d4c9b0"; }
    function onFocus(e, key) { e.target.style.borderBottomColor = fieldErrors[key] ? "#ef4444" : "#c9a84c"; }
    function onBlur(e, key)  { e.target.style.borderBottomColor = bc(key); }

    const inputClass = "w-full h-12 pr-12 text-sm outline-none transition-all border-0 border-b-2 bg-transparent";

    return (
        <>
            <ToastContainer />
            <div className="flex flex-col gap-0">

                {/* ── Email ── */}
                <div className="flex flex-col gap-1.5 mb-5">
                    <label className="text-[10px] font-semibold tracking-[0.18em] uppercase"
                           style={{ color: fieldErrors.email ? "#b91c1c" : "#6b5e3f" }}>
                        Institutional ID / Email
                        {fieldErrors.email && <span className="ml-2 normal-case tracking-normal font-medium text-[10px]">— required</span>}
                    </label>
                    <div className="relative">
                        <input
                            id="email" type="email"
                            placeholder="admin@pradhan-group.com"
                            required value={email}
                            onChange={e => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(f => ({ ...f, email: false })); }}
                            disabled={isLoading}
                            className={inputClass}
                            style={{ borderBottomColor: bc("email"), color: "#1a2d4a", paddingLeft: "2px",
                                     background: fieldErrors.email ? "rgba(254,242,242,0.5)" : "transparent" }}
                            onFocus={e => onFocus(e, "email")}
                            onBlur={e  => onBlur(e, "email")}
                        />
                        <AtSign size={15} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                style={{ color: fieldErrors.email ? "#ef4444" : "#b0a080" }} />
                    </div>
                </div>

                {/* ── Password ── */}
                <div className="flex flex-col gap-1.5 mb-6">
                    <label className="text-[10px] font-semibold tracking-[0.18em] uppercase"
                           style={{ color: fieldErrors.password ? "#b91c1c" : "#6b5e3f" }}>
                        Security Password
                        {fieldErrors.password && <span className="ml-2 normal-case tracking-normal font-medium text-[10px]">— required</span>}
                    </label>
                    <div className="relative">
                        <input
                            id="password" type={showPassword ? "text" : "password"}
                            placeholder="••••••••••••"
                            required value={password}
                            onChange={e => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(f => ({ ...f, password: false })); }}
                            disabled={isLoading}
                            className={inputClass}
                            style={{ borderBottomColor: bc("password"), color: "#1a2d4a", paddingLeft: "2px",
                                     letterSpacing: password ? "0.2em" : "normal",
                                     background: fieldErrors.password ? "rgba(254,242,242,0.5)" : "transparent" }}
                            onFocus={e => onFocus(e, "password")}
                            onBlur={e  => onBlur(e, "password")}
                        />
                        <button type="button" onClick={() => setShowPassword(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                                style={{ color: fieldErrors.password ? "#ef4444" : "#b0a080" }}
                                onMouseEnter={e => e.currentTarget.style.color = fieldErrors.password ? "#b91c1c" : "#c9a84c"}
                                onMouseLeave={e => e.currentTarget.style.color = fieldErrors.password ? "#ef4444" : "#b0a080"}>
                            {showPassword ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>
                    </div>
                </div>

                {/* ── Remember + Forgot ── */}
                <div className="flex items-center justify-between mb-7">
                    <label className="flex items-center gap-2 cursor-pointer select-none" style={{ color: "#6b5e3f" }}>
                        <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                               className="w-3.5 h-3.5 rounded-sm accent-[#c9a84c] cursor-pointer" />
                        <span className="text-[12px] font-medium">Remember this device</span>
                    </label>
                    <button type="button" className="text-[10px] font-bold tracking-[0.15em] uppercase transition-opacity hover:opacity-70"
                            style={{ color: "#c9a84c" }}>
                        Forgot Password?
                    </button>
                </div>

                {/* ── Submit ── */}
                <button
                    type="button" onClick={handleLogin} disabled={isLoading}
                    className="w-full h-[52px] text-[13px] font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-60"
                    style={{ background: isLoading ? "#2a3f5f" : "#1a2d4a", color: "#ffffff", borderRadius: "4px" }}
                    onMouseEnter={e => !isLoading && (e.currentTarget.style.background = "#0f1c2e")}
                    onMouseLeave={e => !isLoading && (e.currentTarget.style.background = "#1a2d4a")}
                >
                    {isLoading
                        ? <><Loader2 size={15} className="animate-spin" /> Authenticating...</>
                        : <>Sign In to Archive <span style={{ color: "#c9a84c", fontWeight: 700 }}>→</span></>
                    }
                </button>

                {/* ── Signup link ── */}
                <p className="text-center text-[12px] mt-5" style={{ color: "#9a8e7a" }}>
                    Don't have an account?{" "}
                    <button
                        type="button"
                        onClick={() => router.push("/signup")}
                        className="font-bold transition-opacity hover:opacity-70"
                        style={{ color: "#c9a84c" }}
                    >
                        Create Account
                    </button>
                </p>

                {/* ── Encrypted session notice ── */}
                <div className="mt-4 flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed"
                     style={{ borderColor: "#c9a84c40", background: "#faf8f4" }}>
                    <ShieldCheck size={13} style={{ color: "#c9a84c" }} />
                    <span className="text-[10px] font-semibold tracking-[0.18em] uppercase" style={{ color: "#6b5e3f" }}>
                        Encrypted 256-bit Session Active
                    </span>
                </div>

            </div>
        </>
    );
}