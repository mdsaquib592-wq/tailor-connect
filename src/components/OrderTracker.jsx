import { CheckCircle2, Clock } from "lucide-react";

const WALKIN_STEPS = [
  { key: "PLACED", label: "Booked" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "FABRIC_RECEIVED", label: "Fabric Given" },
  { key: "CUTTING", label: "Cutting" },
  { key: "STITCHING", label: "Stitching" },
  { key: "READY_FOR_PICKUP", label: "Ready" },
  { key: "DELIVERED", label: "Delivered" },
];

export default function OrderTracker({ currentStatus }) {
  const isReAlt = currentStatus === "RE_ALTERATION_REQUESTED";
  const activeIdx = WALKIN_STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="mt-4">
      {isReAlt && (
        <div className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-300">
          Free Re-Alteration Active — Tailor ko alert bhej diya gaya hai.
        </div>
      )}

      <div className="grid grid-cols-7 gap-1">
        {WALKIN_STEPS.map((step, idx) => {
          const completed = !isReAlt && idx <= activeIdx;
          const isCurrent = !isReAlt && idx === activeIdx;
          return (
            <div
              key={step.key}
              className="flex flex-col items-center text-center"
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] transition ${
                  completed
                    ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                    : "border-slate-700 bg-slate-900 text-slate-500"
                } ${isCurrent ? "ring-2 ring-emerald-400/50 animate-pulse" : ""}`}
              >
                {completed ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
              </div>
              <span
                className={`mt-1 text-[10px] leading-tight ${
                  completed ? "text-emerald-300 font-medium" : "text-slate-500"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
