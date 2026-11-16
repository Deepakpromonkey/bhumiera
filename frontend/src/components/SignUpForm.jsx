"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AtSign, User, Phone, Loader2, ShieldCheck } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { toast, ToastContainer } from "@/components/ui/Toast";

export function SignupForm() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading,    setIsLoading]    = useState(false);

    const [form, setForm] = useState({
        name: "", email: "", phoneNumber: "", password: "",
    });

    const [fieldErrors, setFieldErrors] = useState({
        name: false, email: false, phoneNumber: false, password: false,
    });

    function update(key, val) {
        setForm(f => ({ ...f, [key]: val }));
        if (fieldErrors[key]) setFieldErrors(f => ({ ...f, [key]: false }));
    }

    function validate() {
        const errs = {};
        if (!form.name.trim())                         errs.name        = "Full name is required";
        if (!form.email.trim())                        errs.email       = "Email is required";
        if (!form.phoneNumber.trim())                  errs.phoneNumber = "Phone number is required";
        else if (!/^\d{10}$/.test(form.phoneNumber.trim()))
                                                       errs.phoneNumber = "Enter a valid 10-digit number";
        if (!form.password)                            errs.password    = "Password is required";
        else if (form.password.length < 6)             errs.password    = "Minimum 6 characters";
        return errs;
    }

    async function handleSignup(e) {
        e.preventDefault();
        const errs = validate();

        if (Object.keys(errs).length > 0) {
            // mark fields red
            const bools = {};
            Object.keys(errs).forEach(k => bools[k] = true);
            setFieldErrors(f => ({ ...f, ...bools }));

            const msgs = Object.values(errs);
            toast.error({
                title:   "Form has errors",
                message: msgs.length > 1 ? `${msgs.length} fields need attention.` : msgs[0],
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/auth/register`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    name:        form.name.trim(),
                    email:       form.email.trim(),
                    phoneNumber: form.phoneNumber.trim(),
                    password:    form.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed. Please try again.");
            }

            toast.success({
                title:   "Account Created",
                message: "Registration successful. Redirecting to login...",
                duration: 2500,
            });

            setTimeout(() => router.push("/login"), 1200);

        } catch (err) {
            toast.error({
                title:   "Registration Failed",
                message: err.message,
                duration: 6000,
            });
        } finally {
            setIsLoading(false);
        }
    }

    // ── border helpers ────────────────────────────────────────────────────
    function bc(key)  { return fieldErrors[key] ? "#ef4444" : "#d4c9b0"; }
    function onFocus(e, key) { e.target.style.borderBottomColor = fieldErrors[key] ? "#ef4444" : "#c9a84c"; }
    function onBlur(e, key)  { e.target.style.borderBottomColor = bc(key); }

    // ── shared input style ────────────────────────────────────────────────
    const inputClass = "w-full h-12 pr-12 text-sm outline-none transition-all border-0 border-b-2 bg-transparent";

    return (
        <>
            <ToastContainer />

            <div className="flex flex-col gap-0">

                {/* ── Full Name ── */}
                <div className="flex flex-col gap-1.5 mb-5">
                    <label className="text-[10px] font-semibold tracking-[0.18em] uppercase"
                           style={{ color: fieldErrors.name ? "#b91c1c" : "#6b5e3f" }}>
                        Full Name
                        {fieldErrors.name && <span className="ml-2 normal-case tracking-normal font-medium text-[10px]">— required</span>}
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Bruce Wayne"
                            value={form.name}
                            onChange={e => update("name", e.target.value)}
                            disabled={isLoading}
                            className={inputClass}
                            style={{ borderBottomColor: bc("name"), color: "#1a2d4a", paddingLeft: "2px",
                                     background: fieldErrors.name ? "rgba(254,242,242,0.5)" : "transparent" }}
                            onFocus={e => onFocus(e, "name")}
                            onBlur={e  => onBlur(e, "name")}
                        />
                        <User size={15} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                              style={{ color: fieldErrors.name ? "#ef4444" : "#b0a080" }} />
                    </div>
                </div>

                {/* ── Email ── */}
                <div className="flex flex-col gap-1.5 mb-5">
                    <label className="text-[10px] font-semibold tracking-[0.18em] uppercase"
                           style={{ color: fieldErrors.email ? "#b91c1c" : "#6b5e3f" }}>
                        Email Address
                        {fieldErrors.email && <span className="ml-2 normal-case tracking-normal font-medium text-[10px]">— required</span>}
                    </label>
                    <div className="relative">
                        <input
                            type="email"
                            placeholder="admin@pradhan-group.com"
                            value={form.email}
                            onChange={e => update("email", e.target.value)}
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

                {/* ── Phone Number ── */}
                <div className="flex flex-col gap-1.5 mb-5">
                    <label className="text-[10px] font-semibold tracking-[0.18em] uppercase"
                           style={{ color: fieldErrors.phoneNumber ? "#b91c1c" : "#6b5e3f" }}>
                        Phone Number
                        {fieldErrors.phoneNumber && (
                            <span className="ml-2 normal-case tracking-normal font-medium text-[10px]">
                                — {fieldErrors.phoneNumber === true ? "required" : "invalid"}
                            </span>
                        )}
                    </label>
                    <div className="relative">
                        <input
                            type="tel"
                            placeholder="9876543210"
                            maxLength={10}
                            value={form.phoneNumber}
                            onChange={e => update("phoneNumber", e.target.value.replace(/\D/g, ""))}
                            disabled={isLoading}
                            className={inputClass}
                            style={{ borderBottomColor: bc("phoneNumber"), color: "#1a2d4a", paddingLeft: "2px",
                                     background: fieldErrors.phoneNumber ? "rgba(254,242,242,0.5)" : "transparent" }}
                            onFocus={e => onFocus(e, "phoneNumber")}
                            onBlur={e  => onBlur(e, "phoneNumber")}
                        />
                        <Phone size={15} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                               style={{ color: fieldErrors.phoneNumber ? "#ef4444" : "#b0a080" }} />
                    </div>
                </div>

                {/* ── Password ── */}
                <div className="flex flex-col gap-1.5 mb-7">
                    <label className="text-[10px] font-semibold tracking-[0.18em] uppercase"
                           style={{ color: fieldErrors.password ? "#b91c1c" : "#6b5e3f" }}>
                        Password
                        {fieldErrors.password && <span className="ml-2 normal-case tracking-normal font-medium text-[10px]">— required</span>}
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••••••"
                            value={form.password}
                            onChange={e => update("password", e.target.value)}
                            disabled={isLoading}
                            className={inputClass}
                            style={{ borderBottomColor: bc("password"), color: "#1a2d4a", paddingLeft: "2px",
                                     letterSpacing: form.password ? "0.2em" : "normal",
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
                    <p className="text-[10px] mt-0.5" style={{ color: "#9a8e7a" }}>Minimum 6 characters</p>
                </div>

                {/* ── Submit ── */}
                <button
                    type="button"
                    onClick={handleSignup}
                    disabled={isLoading}
                    className="w-full h-[52px] text-[13px] font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-60"
                    style={{ background: isLoading ? "#2a3f5f" : "#1a2d4a", color: "#ffffff", borderRadius: "4px" }}
                    onMouseEnter={e => !isLoading && (e.currentTarget.style.background = "#0f1c2e")}
                    onMouseLeave={e => !isLoading && (e.currentTarget.style.background = "#1a2d4a")}
                >
                    {isLoading ? (
                        <><Loader2 size={15} className="animate-spin" /> Creating Account...</>
                    ) : (
                        <>Create Account <span style={{ color: "#c9a84c", fontWeight: 700 }}>→</span></>
                    )}
                </button>

                {/* ── Login link ── */}
                <p className="text-center text-[12px] mt-5" style={{ color: "#9a8e7a" }}>
                    Already have an account?{" "}
                    <button
                        type="button"
                        onClick={() => router.push("/login")}
                        className="font-bold transition-opacity hover:opacity-70"
                        style={{ color: "#c9a84c" }}
                    >
                        Sign In
                    </button>
                </p>

                {/* ── Encrypted notice ── */}
                <div className="mt-4 flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed"
                     style={{ borderColor: "#c9a84c40", background: "#faf8f4" }}>
                    <ShieldCheck size={13} style={{ color: "#c9a84c" }} />
                    <span className="text-[10px] font-semibold tracking-[0.18em] uppercase"
                          style={{ color: "#6b5e3f" }}>
                        Encrypted 256-bit Session Active
                    </span>
                </div>

            </div>
        </>
    );
}