import { useEffect, useState } from "react";
import {
  Store,
  ShoppingBag,
  Ruler,
  Bike,
  Lock,
  Sparkles,
  MapPin,
  Plus,
  RefreshCw,
  Upload,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  subscribeTailors,
  subscribeOrdersByField,
  subscribeMeasurements,
  addMeasurementProfile,
  createWalkInOrder,
  requestReAlteration,
  uploadDesignImage,
} from "../services/dbService";
import Navbar from "../components/Navbar";
import OrderTracker from "../components/OrderTracker";

export default function CustomerDashboard() {
  const { user, userData } = useAuth();
  const [tab, setTab] = useState("explore");
  const [tailors, setTailors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [pincodeFilter, setPincodeFilter] = useState("");

  // Booking Modal State
  const [selectedTailor, setSelectedTailor] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [urgency, setUrgency] = useState("STANDARD");
  const [walkInSlot, setWalkInSlot] = useState("");
  const [measurementMethod, setMeasurementMethod] = useState("STORE_VISIT");
  const [selectedMeasId, setSelectedMeasId] = useState("");
  const [design, setDesign] = useState({
    neckDesign: "Boat Neck",
    sleeveDesign: "3/4th Sleeve",
    fitting: "Regular",
    hasLining: false,
    referenceImageUrl: "",
    instructionsText: "",
  });
  const [bookingBusy, setBookingBusy] = useState(false);

  // New Measurement Form
  const [newMeas, setNewMeas] = useState({
    profileName: "",
    chest: "",
    waist: "",
    shoulder: "",
    sleeveLength: "",
    length: "",
  });

  useEffect(() => {
    const u1 = subscribeTailors(setTailors);
    const u2 = subscribeOrdersByField("customerId", user.uid, setOrders);
    const u3 = subscribeMeasurements(user.uid, setMeasurements);
    return () => {
      u1();
      u2();
      u3();
    };
  }, [user.uid]);

  const filteredTailors = tailors.filter(
    (t) => !pincodeFilter || (t.pincode || "").includes(pincodeFilter.trim()),
  );

  function openBooking(tailor) {
    setSelectedTailor(tailor);
    setSelectedService(tailor.catalog?.[0] || null);
    setWalkInSlot("");
  }

  async function handleImageFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadDesignImage(file);
      setDesign((prev) => ({ ...prev, referenceImageUrl: url }));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handlePlaceOrder(e) {
    e.preventDefault();
    if (!selectedTailor || !selectedService) return;
    setBookingBusy(true);
    try {
      const measObj =
        measurementMethod === "SAVED_PROFILE"
          ? measurements.find((m) => m.id === selectedMeasId) || null
          : null;

      await createWalkInOrder({
        customerId: user.uid,
        customerName: userData.name,
        customerPhone: userData.phone,
        tailorId: selectedTailor.tailorId,
        shopName: selectedTailor.shopName,
        baseAmount: selectedService.basePrice,
        urgency,
        walkInSlot,
        measurementMethod,
        measurementSnapshot: measObj,
        garmentDetails: {
          serviceName: selectedService.name,
          urgency,
          ...design,
        },
      });
      setSelectedTailor(null);
      setTab("orders");
    } catch (err) {
      alert("Order error: " + err.message);
    } finally {
      setBookingBusy(false);
    }
  }

  async function handleSaveMeasurement(e) {
    e.preventDefault();
    if (!newMeas.profileName) return;
    await addMeasurementProfile({
      customerId: user.uid,
      profileName: newMeas.profileName,
      values: {
        chest: newMeas.chest,
        waist: newMeas.waist,
        shoulder: newMeas.shoulder,
        sleeveLength: newMeas.sleeveLength,
        length: newMeas.length,
      },
    });
    setNewMeas({
      profileName: "",
      chest: "",
      waist: "",
      shoulder: "",
      sleeveLength: "",
      length: "",
    });
  }

  async function handleReAlteration(orderId) {
    const reason = prompt(
      "Fitting mein kya change karwana hai? (e.g., Waist 1 inch tight karni hai)",
    );
    if (!reason) return;
    await requestReAlteration(orderId, reason);
  }

  const basePrice = Number(selectedService?.basePrice || 0);
  const expressFee =
    urgency === "EXPRESS_48H" ? Math.round(basePrice * 0.3) : 0;
  const totalPayable = basePrice + expressFee + 15;

  return (
    <div className="min-h-screen bg-slate-950 pb-16">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pt-6">
        {/* Top Navigation Tabs */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 rounded-2xl border border-white/10 bg-slate-900/70 p-1.5">
            {[
              { id: "explore", label: "Explore Tailors", icon: Store },
              {
                id: "orders",
                label: `My Orders (${orders.length})`,
                icon: ShoppingBag,
              },
              { id: "measurements", label: "Saved Naap", icon: Ruler },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                    tab === item.id
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {tab === "explore" && (
            <input
              placeholder="Filter by Pincode (e.g. 800001)"
              value={pincodeFilter}
              onChange={(e) => setPincodeFilter(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-xs text-white outline-none focus:border-indigo-500"
            />
          )}
        </div>

        {/* TAB 1: EXPLORE TAILORS */}
        {tab === "explore" && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredTailors.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-white/10 bg-slate-900/50 p-10 text-center">
                <p className="text-slate-300 font-medium">
                  Abhi koi Tailor registered nahi hai.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Test karne ke liye doosre browser tab (Incognito) mein jakar
                  "Tailor" role se account banayein—turant yahan live dikhega!
                </p>
              </div>
            ) : (
              filteredTailors.map((t) => {
                const isFull =
                  (t.todayOrderCount || 0) >= (t.dailyMaxOrders || 6);
                const canBook = t.isAcceptingOrders && !isFull;
                return (
                  <div
                    key={t.id}
                    className="flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/70 p-5 backdrop-blur-xl transition hover:border-indigo-500/40"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            {t.shopName}
                          </h3>
                          <p className="flex items-center gap-1 text-xs text-slate-400">
                            <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                            Pincode: {t.pincode} • Master: {t.ownerName}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            canBook
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-rose-500/20 text-rose-300"
                          }`}
                        >
                          {canBook ? "OPEN" : "BUSY"}
                        </span>
                      </div>

                      <div className="mt-4 space-y-1.5 border-t border-white/5 pt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Starting Rates
                        </p>
                        {(t.catalog || []).slice(0, 3).map((srv) => (
                          <div
                            key={srv.id}
                            className="flex justify-between text-xs text-slate-300"
                          >
                            <span>{srv.name}</span>
                            <span className="font-semibold text-indigo-300">
                              ₹{srv.basePrice}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      disabled={!canBook}
                      onClick={() => openBooking(t)}
                      className="mt-5 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 text-xs font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {canBook
                        ? "Book Walk-In Slot & Design"
                        : "Today's Limit Full"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: MY ORDERS (LIVE TRACKER) */}
        {tab === "orders" && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-10 text-center text-sm text-slate-400">
                Aapne abhi tak koi stitching order place nahi kiya hai.
              </div>
            ) : (
              orders.map((ord) => {
                const canReAlter =
                  ord.status === "DELIVERED" &&
                  !ord.reAlteration?.isRequested &&
                  ord.reAlteration?.eligibleUntilMs > Date.now();

                return (
                  <div
                    key={ord.id}
                    className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-mono text-indigo-400">
                          {ord.orderCode}
                        </span>
                        <h3 className="text-base font-bold text-white">
                          {ord.garmentDetails?.serviceName} — {ord.shopName}
                        </h3>
                        <p className="text-xs text-slate-400">
                          Walk-in Slot:{" "}
                          <strong className="text-slate-200">
                            {ord.walkInSlot}
                          </strong>{" "}
                          • {ord.garmentDetails?.neckDesign} /{" "}
                          {ord.garmentDetails?.sleeveDesign} /{" "}
                          {ord.garmentDetails?.fitting}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-center">
                          <p className="text-[10px] text-indigo-300">
                            DELIVERY OTP
                          </p>
                          <p className="font-mono text-sm font-bold tracking-widest text-white">
                            {ord.verification?.deliveryOtp}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-400">
                            ₹{ord.pricing?.totalPayable}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {ord.pricing?.paymentStatus}
                          </p>
                        </div>
                      </div>
                    </div>

                    <OrderTracker currentStatus={ord.status} />

                    {canReAlter && (
                      <div className="mt-4 flex justify-end border-t border-white/5 pt-3">
                        <button
                          onClick={() => handleReAlteration(ord.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Request Free 48h Re-Alteration
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: SAVED MEASUREMENTS */}
        {tab === "measurements" && (
          <div className="grid gap-6 md:grid-cols-2">
            <form
              onSubmit={handleSaveMeasurement}
              className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 space-y-3"
            >
              <h3 className="flex items-center gap-2 text-base font-bold text-white">
                <Plus className="h-4 w-4 text-indigo-400" />
                Naya Digital Naap Save Karein (Inches)
              </h3>
              <input
                required
                placeholder="Profile Name (e.g., Self, Sister, Mom)"
                value={newMeas.profileName}
                onChange={(e) =>
                  setNewMeas({ ...newMeas, profileName: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                {["chest", "waist", "shoulder", "sleeveLength", "length"].map(
                  (field) => (
                    <input
                      key={field}
                      type="number"
                      step="0.5"
                      placeholder={`${field.toUpperCase()} (in)`}
                      value={newMeas[field]}
                      onChange={(e) =>
                        setNewMeas({ ...newMeas, [field]: e.target.value })
                      }
                      className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white"
                    />
                  ),
                )}
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Save Measurement Profile
              </button>
            </form>

            <div className="space-y-3">
              {measurements.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"
                >
                  <h4 className="font-bold text-indigo-300">{m.profileName}</h4>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-300">
                    <span>Chest: {m.values?.chest || "-"}"</span>
                    <span>Waist: {m.values?.waist || "-"}"</span>
                    <span>Shoulder: {m.values?.shoulder || "-"}"</span>
                    <span>Sleeve: {m.values?.sleeveLength || "-"}"</span>
                    <span>Length: {m.values?.length || "-"}"</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* BOOKING & DESIGN STUDIO MODAL */}
      {selectedTailor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={handlePlaceOrder}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/15 bg-slate-900 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {selectedTailor.shopName}
                </h2>
                <p className="text-xs text-slate-400">
                  Customize design aur slot select karein
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTailor(null)}
                className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-300"
              >
                Close
              </button>
            </div>

            {/* Service Mode: Walk-In Active vs Rider Coming Soon */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                Service Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border-2 border-indigo-500 bg-indigo-500/15 p-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Store className="h-4 w-4 text-indigo-400" />
                    Walk-In / Self-Drop
                  </div>
                  <p className="mt-1 text-[11px] text-slate-300">
                    Shop par slot book karein — Zero waiting!
                  </p>
                </div>

                <div className="relative cursor-not-allowed rounded-xl border border-amber-500/30 bg-slate-950/70 p-3 opacity-80">
                  <span className="absolute -top-2.5 right-2 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[9px] font-extrabold text-slate-950">
                    <Sparkles className="h-2.5 w-2.5" /> COMING SOON
                  </span>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <Bike className="h-4 w-4" />
                    Doorstep Rider
                    <Lock className="h-3 w-3" />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Ghar se pickup & drop jald hi shuru hoga.
                  </p>
                </div>
              </div>
            </div>

            {/* Service Selection & Urgency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Select Garment Service
                </label>
                <select
                  value={selectedService?.id || ""}
                  onChange={(e) =>
                    setSelectedService(
                      selectedTailor.catalog.find(
                        (c) => c.id === e.target.value,
                      ),
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-xs text-white"
                >
                  {(selectedTailor.catalog || []).map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.name} (₹{srv.basePrice})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Delivery Speed
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-xs text-white"
                >
                  <option value="STANDARD">
                    Standard ({selectedService?.days || 4} Days)
                  </option>
                  <option value="EXPRESS_48H">Express 48 Hours (+30%)</option>
                </select>
              </div>
            </div>

            {/* Walk-in Date & Time */}
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Shop Visit Slot (Kapda aur Naap dene ka time)
              </label>
              <input
                required
                type="datetime-local"
                value={walkInSlot}
                onChange={(e) => setWalkInSlot(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-xs text-white"
              />
            </div>

            {/* Measurement Method */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Measurement Method
                </label>
                <select
                  value={measurementMethod}
                  onChange={(e) => setMeasurementMethod(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-xs text-white"
                >
                  <option value="STORE_VISIT">Dukaan par Naap dunga</option>
                  <option value="SAMPLE_GARMENT">
                    Sample Fit Kapda launga
                  </option>
                  <option value="SAVED_PROFILE">
                    Saved Digital Profile use karein
                  </option>
                </select>
              </div>

              {measurementMethod === "SAVED_PROFILE" && (
                <div>
                  <label className="mb-1 block text-xs text-slate-400">
                    Choose Profile
                  </label>
                  <select
                    required
                    value={selectedMeasId}
                    onChange={(e) => setSelectedMeasId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-xs text-white"
                  >
                    <option value="">-- Select Naap --</option>
                    {measurements.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.profileName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Design Studio Options */}
            <div className="grid grid-cols-3 gap-2">
              <input
                placeholder="Neck (e.g. Boat)"
                value={design.neckDesign}
                onChange={(e) =>
                  setDesign({ ...design, neckDesign: e.target.value })
                }
                className="rounded-xl border border-white/10 bg-slate-950 p-2 text-xs text-white"
              />
              <input
                placeholder="Sleeve (e.g. Full)"
                value={design.sleeveDesign}
                onChange={(e) =>
                  setDesign({ ...design, sleeveDesign: e.target.value })
                }
                className="rounded-xl border border-white/10 bg-slate-950 p-2 text-xs text-white"
              />
              <select
                value={design.fitting}
                onChange={(e) =>
                  setDesign({ ...design, fitting: e.target.value })
                }
                className="rounded-xl border border-white/10 bg-slate-950 p-2 text-xs text-white"
              >
                <option value="Regular">Regular Fit</option>
                <option value="Slim">Slim Fit</option>
                <option value="Loose">Comfort / Loose</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                placeholder="Reference Design Photo URL (Optional)"
                value={design.referenceImageUrl}
                onChange={(e) =>
                  setDesign({ ...design, referenceImageUrl: e.target.value })
                }
                className="flex-1 rounded-xl border border-white/10 bg-slate-950 p-2 text-xs text-white"
              />
              <label className="flex cursor-pointer items-center gap-1 rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-xs text-slate-200 hover:bg-slate-700">
                <Upload className="h-3.5 w-3.5" />
                Upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFile}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              rows={2}
              placeholder="Special Instructions (e.g., Side zip lagani hai, Dori chahiye...)"
              value={design.instructionsText}
              onChange={(e) =>
                setDesign({ ...design, instructionsText: e.target.value })
              }
              className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-xs text-white"
            />

            {/* Bill Breakdown */}
            <div className="rounded-2xl border border-indigo-500/20 bg-slate-950 p-4 text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Stitching Base Charge</span>
                <span>₹{basePrice}</span>
              </div>
              {expressFee > 0 && (
                <div className="flex justify-between text-amber-300">
                  <span>Express 48h Surcharge (30%)</span>
                  <span>+₹{expressFee}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Walk-in Platform Fee</span>
                <span>+₹15</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-sm font-bold text-white">
                <span>Total Payable (Pay at Shop)</span>
                <span className="text-emerald-400">₹{totalPayable}</span>
              </div>
            </div>

            <button
              disabled={bookingBusy}
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-3 text-sm font-bold text-white shadow-lg"
            >
              {bookingBusy ? "Booking..." : "Confirm Walk-In Order"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
