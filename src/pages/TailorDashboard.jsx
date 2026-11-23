import { useEffect, useState } from "react";
import {
  ShoppingBag,
  Store,
  Wallet,
  Bike,
  Sparkles,
  Plus,
  Trash2,
  ShieldCheck,
  Phone,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  subscribeSingleTailor,
  subscribeOrdersByField,
  updateOrderStatus,
  updateTailorProfile,
} from "../services/dbService";
import Navbar from "../components/Navbar";

const NEXT_STATUS = {
  PLACED: { next: "ACCEPTED", label: "Accept Order" },
  ACCEPTED: { next: "FABRIC_RECEIVED", label: "Mark Fabric Received" },
  FABRIC_RECEIVED: { next: "CUTTING", label: "Start Cutting" },
  CUTTING: { next: "STITCHING", label: "Start Stitching" },
  STITCHING: { next: "READY_FOR_PICKUP", label: "Mark Ready for Pickup" },
  RE_ALTERATION_REQUESTED: {
    next: "READY_FOR_PICKUP",
    label: "Re-Alteration Fixed (Ready)",
  },
};

export default function TailorDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("orders");
  const [shop, setShop] = useState(null);
  const [orders, setOrders] = useState([]);
  const [otpInputs, setOtpInputs] = useState({});
  const [newService, setNewService] = useState({
    name: "",
    basePrice: "",
    days: "3",
  });

  useEffect(() => {
    const u1 = subscribeSingleTailor(user.uid, setShop);
    const u2 = subscribeOrdersByField("tailorId", user.uid, setOrders);
    return () => {
      u1();
      u2();
    };
  }, [user.uid]);

  async function toggleAccepting() {
    if (!shop) return;
    await updateTailorProfile(user.uid, {
      isAcceptingOrders: !shop.isAcceptingOrders,
    });
  }

  async function handleDeliverWithOtp(order) {
    const entered = (otpInputs[order.id] || "").trim();
    if (entered !== order.verification?.deliveryOtp) {
      alert("Galat OTP! Customer se sahi 4-digit Delivery OTP maangein.");
      return;
    }
    await updateOrderStatus(
      order.id,
      "DELIVERED",
      "Delivered & verified via Customer OTP",
    );
  }

  async function handleAddService(e) {
    e.preventDefault();
    if (!newService.name || !newService.basePrice) return;
    const updatedCatalog = [
      ...(shop.catalog || []),
      {
        id: `srv_${Date.now()}`,
        name: newService.name,
        basePrice: Number(newService.basePrice),
        days: Number(newService.days),
      },
    ];
    await updateTailorProfile(user.uid, { catalog: updatedCatalog });
    setNewService({ name: "", basePrice: "", days: "3" });
  }

  async function handleDeleteService(id) {
    const updatedCatalog = (shop.catalog || []).filter((c) => c.id !== id);
    await updateTailorProfile(user.uid, { catalog: updatedCatalog });
  }

  const totalNetEarnings = orders
    .filter((o) => o.status === "DELIVERED")
    .reduce((sum, o) => sum + (o.pricing?.tailorNetEarning || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 pb-16">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pt-6">
        {/* Top Control Bar */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs text-slate-400">Shop Status</p>
            <div className="mt-2 flex items-center justify-between">
              <span
                className={`text-sm font-bold ${
                  shop?.isAcceptingOrders ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {shop?.isAcceptingOrders
                  ? "Accepting Orders"
                  : "Shop Busy / Paused"}
              </span>
              <button
                onClick={toggleAccepting}
                className="rounded-lg border border-white/15 bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Toggle
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs text-slate-400">Daily Capacity</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {shop?.todayOrderCount || 0} / {shop?.dailyMaxOrders || 6}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs text-slate-400">Active Orders</p>
            <p className="mt-1 text-2xl font-bold text-indigo-400">
              {orders.filter((o) => o.status !== "DELIVERED").length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs text-slate-400">Net Delivered Earnings</p>
            <p className="mt-1 text-2xl font-bold text-emerald-400">
              ₹{totalNetEarnings}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-slate-900/70 p-1.5">
          {[
            { id: "orders", label: "Live Orders Queue", icon: ShoppingBag },
            { id: "shop", label: "Rate Card & Limits", icon: Store },
            { id: "khata", label: "Digital Khata", icon: Wallet },
            { id: "rider", label: "Rider Dispatch (Soon)", icon: Bike },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  tab === item.id
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: LIVE ORDERS */}
        {tab === "orders" && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-10 text-center text-sm text-slate-400">
                Abhi koi live order nahi aaya hai. Jaise hi customer order
                karega, bina refresh kiye yahan dikh jayega!
              </div>
            ) : (
              orders.map((ord) => {
                const action = NEXT_STATUS[ord.status];
                return (
                  <div
                    key={ord.id}
                    className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-indigo-400">
                            {ord.orderCode}
                          </span>
                          <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300">
                            {ord.status.replaceAll("_", " ")}
                          </span>
                          {ord.garmentDetails?.urgency === "EXPRESS_48H" && (
                            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                              EXPRESS 48H
                            </span>
                          )}
                        </div>
                        <h3 className="mt-1 text-base font-bold text-white">
                          {ord.garmentDetails?.serviceName} — {ord.customerName}
                        </h3>
                        <p className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Phone className="h-3 w-3" /> {ord.customerPhone} •
                          Walk-In:{" "}
                          <strong className="text-slate-200">
                            {ord.walkInSlot}
                          </strong>
                        </p>
                        <p className="mt-1 text-xs text-slate-300">
                          Design: {ord.garmentDetails?.neckDesign},{" "}
                          {ord.garmentDetails?.sleeveDesign},{" "}
                          {ord.garmentDetails?.fitting} Fit
                        </p>
                        {ord.garmentDetails?.instructionsText && (
                          <p className="mt-1 text-xs text-amber-200/90">
                            Note: "{ord.garmentDetails.instructionsText}"
                          </p>
                        )}
                        {ord.measurementSnapshot && (
                          <div className="mt-2 rounded-lg bg-slate-950 px-3 py-1.5 text-[11px] text-emerald-300">
                            Saved Naap ({ord.measurementSnapshot.profileName}):
                            Chest {ord.measurementSnapshot.values?.chest}",
                            Waist {ord.measurementSnapshot.values?.waist}",
                            Shoulder {ord.measurementSnapshot.values?.shoulder}
                            ", Sleeve{" "}
                            {ord.measurementSnapshot.values?.sleeveLength}",
                            Length {ord.measurementSnapshot.values?.length}"
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <p className="text-sm font-bold text-emerald-400">
                          Net Earning: ₹{ord.pricing?.tailorNetEarning}
                        </p>

                        {action && (
                          <button
                            onClick={() =>
                              updateOrderStatus(ord.id, action.next)
                            }
                            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                          >
                            {action.label}
                          </button>
                        )}

                        {ord.status === "READY_FOR_PICKUP" && (
                          <div className="flex items-center gap-2">
                            <input
                              maxLength={4}
                              placeholder="Customer OTP"
                              value={otpInputs[ord.id] || ""}
                              onChange={(e) =>
                                setOtpInputs({
                                  ...otpInputs,
                                  [ord.id]: e.target.value,
                                })
                              }
                              className="w-28 rounded-xl border border-emerald-500/40 bg-slate-950 px-3 py-1.5 text-center font-mono text-xs text-white"
                            />
                            <button
                              onClick={() => handleDeliverWithOtp(ord)}
                              className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Verify & Deliver
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: RATE CARD & CAPACITY */}
        {tab === "shop" && shop && (
          <div className="grid gap-6 md:grid-cols-2">
            <form
              onSubmit={handleAddService}
              className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 space-y-3"
            >
              <h3 className="flex items-center gap-2 font-bold text-white">
                <Plus className="h-4 w-4 text-indigo-400" />
                Nayi Stitching Service Add Karein
              </h3>
              <input
                required
                placeholder="Service Name (e.g., Bridal Lehenga Stitching)"
                value={newService.name}
                onChange={(e) =>
                  setNewService({ ...newService, name: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-xs text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  type="number"
                  placeholder="Price (₹)"
                  value={newService.basePrice}
                  onChange={(e) =>
                    setNewService({ ...newService, basePrice: e.target.value })
                  }
                  className="rounded-xl border border-white/10 bg-slate-950 p-2.5 text-xs text-white"
                />
                <input
                  required
                  type="number"
                  placeholder="Days Needed"
                  value={newService.days}
                  onChange={(e) =>
                    setNewService({ ...newService, days: e.target.value })
                  }
                  className="rounded-xl border border-white/10 bg-slate-950 p-2.5 text-xs text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white"
              >
                Add to Rate Card
              </button>

              <div className="border-t border-white/10 pt-4">
                <label className="block text-xs text-slate-400">
                  Daily Order Limit
                </label>
                <div className="mt-2 flex gap-2">
                  {[5, 8, 12, 20].map((limit) => (
                    <button
                      type="button"
                      key={limit}
                      onClick={() =>
                        updateTailorProfile(user.uid, { dailyMaxOrders: limit })
                      }
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        shop.dailyMaxOrders === limit
                          ? "bg-purple-600 text-white"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {limit} / day
                    </button>
                  ))}
                </div>
              </div>
            </form>

            <div className="space-y-2">
              <h3 className="font-bold text-white">Aapka Live Rate Card</h3>
              {(shop.catalog || []).map((srv) => (
                <div
                  key={srv.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/70 p-3.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {srv.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      ₹{srv.basePrice} • {srv.days} Days
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteService(srv.id)}
                    className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DIGITAL KHATA */}
        {tab === "khata" && (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/70">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-slate-950/60 text-slate-400">
                <tr>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Gross Bill</th>
                  <th className="p-3">Platform Fee (15%)</th>
                  <th className="p-3">Your Net</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="p-3 font-mono text-indigo-300">
                      {o.orderCode}
                    </td>
                    <td className="p-3 text-white">{o.customerName}</td>
                    <td className="p-3 text-slate-300">
                      ₹
                      {(o.pricing?.baseAmount || 0) +
                        (o.pricing?.expressFee || 0)}
                    </td>
                    <td className="p-3 text-rose-400">
                      -₹{o.pricing?.platformCommission}
                    </td>
                    <td className="p-3 font-bold text-emerald-400">
                      ₹{o.pricing?.tailorNetEarning}
                    </td>
                    <td className="p-3 text-slate-400">{o.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: RIDER DISPATCH (COMING SOON) */}
        {tab === "rider" && (
          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
              <Bike className="h-8 w-8" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-extrabold text-slate-950">
              <Sparkles className="h-3.5 w-3.5" /> PHASE 2 — COMING SOON
            </span>
            <h2 className="mt-4 text-2xl font-bold text-white">
              Automated Rider Pickup & Drop Fleet
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400">
              Jald hi aap ek click mein Rider call kar sakenge jo customer ke
              ghar se unstitched kapda pick karke aapki dukaan par drop karega
              aur silai ke baad OTP verification ke saath wapas deliver karega.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
