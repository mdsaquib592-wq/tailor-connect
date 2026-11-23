import { Scissors, LogOut, Bike } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { userData, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/20">
            <Scissors className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Tailor<span className="text-indigo-400">Connect</span>
            </h1>
            <p className="text-[11px] uppercase tracking-wider text-slate-400">
              {userData?.role === "tailor"
                ? "Tailor Partner Studio"
                : "Customer Portal"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            title="Doorstep Rider Fleet is launching in Phase 2"
            className="hidden sm:flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300"
          >
            <Bike className="h-3.5 w-3.5" />
            <span>Rider Pickup: Coming Soon</span>
          </div>

          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-white">{userData?.name}</p>
            <p className="text-xs text-slate-400">{userData?.phone}</p>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:border-rose-500/40 hover:text-rose-300 transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
