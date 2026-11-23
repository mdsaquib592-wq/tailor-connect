import { useState } from "react";
import { Scissors, User, Store, Bike, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("customer");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    shopName: "",
    pincode: "800001",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await signup({ ...form, role });
      }
    } catch (err) {
      setError(err.message.replace("Firebase:", "").trim());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-slate-950 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/70 p-7 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
            <Scissors className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Tailor Connect</h1>
          <p className="mt-1 text-sm text-slate-400">
            Smart Walk-In Tailoring & Digital Measurement Platform
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-xl bg-slate-950 p-1">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              isLogin
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              !isLogin
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {!isLogin && (
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium text-slate-400">
              Account Type Chunein
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole("customer")}
                className={`flex flex-col items-center rounded-xl border p-2.5 text-xs transition ${
                  role === "customer"
                    ? "border-indigo-400 bg-indigo-500/20 text-white"
                    : "border-white/10 bg-slate-950/60 text-slate-400"
                }`}
              >
                <User className="mb-1 h-4 w-4" />
                Customer
              </button>

              <button
                type="button"
                onClick={() => setRole("tailor")}
                className={`flex flex-col items-center rounded-xl border p-2.5 text-xs transition ${
                  role === "tailor"
                    ? "border-purple-400 bg-purple-500/20 text-white"
                    : "border-white/10 bg-slate-950/60 text-slate-400"
                }`}
              >
                <Store className="mb-1 h-4 w-4" />
                Tailor
              </button>

              <div
                title="Rider Fleet Phase-2 mein launch hoga"
                className="relative flex cursor-not-allowed flex-col items-center rounded-xl border border-amber-500/20 bg-slate-950/40 p-2.5 text-xs text-slate-500 opacity-75"
              >
                <span className="absolute -top-2 rounded-full bg-amber-500 px-1.5 py-0.5 text-[8px] font-bold text-slate-950">
                  SOON
                </span>
                <div className="flex items-center gap-0.5">
                  <Bike className="mb-1 h-4 w-4" />
                  <Lock className="mb-1 h-2.5 w-2.5" />
                </div>
                Rider
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <>
              <input
                required
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                />
                <input
                  required
                  placeholder="Pincode (e.g. 800001)"
                  value={form.pincode}
                  onChange={(e) =>
                    setForm({ ...form, pincode: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
              {role === "tailor" && (
                <input
                  required
                  placeholder="Boutique / Tailor Shop Name"
                  value={form.shopName}
                  onChange={(e) =>
                    setForm({ ...form, shopName: e.target.value })
                  }
                  className="w-full rounded-xl border border-purple-500/40 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-400"
                />
              )}
            </>
          )}

          <input
            required
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
          />
          <input
            required
            type="password"
            minLength={6}
            placeholder="Password (min 6 chars)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
          />

          <button
            disabled={submitting}
            type="submit"
            className="mt-2 w-full rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 disabled:opacity-50"
          >
            {submitting
              ? "Please wait..."
              : isLogin
                ? "Login Karein"
                : "Account Banayein"}
          </button>
        </form>
      </div>
    </div>
  );
}
