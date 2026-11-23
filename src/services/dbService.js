import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
  arrayUnion,
  increment,
} from "firebase/firestore";
import { db } from "../firebase/config";

const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

// 1. Live Tailors list (Customer Discovery)
export function subscribeTailors(callback) {
  return onSnapshot(collection(db, "tailors"), (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(list);
  });
}

// 2. Single Tailor live profile (Tailor Dashboard)
export function subscribeSingleTailor(tailorId, callback) {
  return onSnapshot(doc(db, "tailors", tailorId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

export function updateTailorProfile(tailorId, updates) {
  return updateDoc(doc(db, "tailors", tailorId), updates);
}

// 3. Saved Measurements (Family Profiles)
export function subscribeMeasurements(customerId, callback) {
  const q = query(
    collection(db, "measurements"),
    where("customerId", "==", customerId),
  );
  return onSnapshot(q, (snap) => {
    const list = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
    callback(list);
  });
}

export function addMeasurementProfile(data) {
  return addDoc(collection(db, "measurements"), {
    ...data,
    createdAtMs: Date.now(),
  });
}

// 4. Create Walk-in Order (Automatic Commission + Delivery OTP)
export async function createWalkInOrder(input) {
  const baseAmount = Number(input.baseAmount);
  const expressFee =
    input.urgency === "EXPRESS_48H" ? Math.round(baseAmount * 0.3) : 0;
  const platformFee = 15; // Walk-in convenience fee
  const commissionRate = 0.15; // 15% platform commission

  const stitchingSubtotal = baseAmount + expressFee;
  const platformCommission = Math.round(stitchingSubtotal * commissionRate);
  const tailorNetEarning = stitchingSubtotal - platformCommission;
  const totalPayable = stitchingSubtotal + platformFee;

  const orderData = {
    orderCode: `TC-${Math.floor(100000 + Math.random() * 900000)}`,
    customerId: input.customerId,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    tailorId: input.tailorId,
    shopName: input.shopName,
    serviceMode: "WALK_IN",
    walkInSlot: input.walkInSlot,
    measurementMethod: input.measurementMethod,
    measurementSnapshot: input.measurementSnapshot || null,
    garmentDetails: input.garmentDetails,
    status: "PLACED",
    statusHistory: [
      {
        status: "PLACED",
        note: `Walk-in slot booked for ${input.walkInSlot}`,
        time: new Date().toLocaleString(),
      },
    ],
    verification: {
      deliveryOtp: generateOtp(),
    },
    pricing: {
      baseAmount,
      expressFee,
      platformFee,
      platformCommission,
      tailorNetEarning,
      totalPayable,
      paymentStatus: "PAY_AT_SHOP",
    },
    reAlteration: {
      isRequested: false,
      reason: "",
      eligibleUntilMs: null,
    },
    createdAtMs: Date.now(),
  };

  const docRef = await addDoc(collection(db, "orders"), orderData);
  await updateDoc(doc(db, "tailors", input.tailorId), {
    todayOrderCount: increment(1),
  });
  return docRef.id;
}

// 5. Real-time Orders Listener (Sorted client-side to avoid Firestore index errors)
export function subscribeOrdersByField(field, value, callback) {
  const q = query(collection(db, "orders"), where(field, "==", value));
  return onSnapshot(q, (snap) => {
    const list = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
    callback(list);
  });
}

// 6. Order Status Progression
export async function updateOrderStatus(orderId, newStatus, note = "") {
  const updates = {
    status: newStatus,
    statusHistory: arrayUnion({
      status: newStatus,
      note: note || `Order moved to ${newStatus.replaceAll("_", " ")}`,
      time: new Date().toLocaleString(),
    }),
  };

  if (newStatus === "DELIVERED") {
    updates["pricing.paymentStatus"] = "PAID";
    updates["reAlteration.eligibleUntilMs"] = Date.now() + 48 * 60 * 60 * 1000;
  }

  return updateDoc(doc(db, "orders", orderId), updates);
}

// 7. 48-Hour Free Re-Alteration Request
export function requestReAlteration(orderId, reason) {
  return updateDoc(doc(db, "orders", orderId), {
    status: "RE_ALTERATION_REQUESTED",
    "reAlteration.isRequested": true,
    "reAlteration.reason": reason,
    statusHistory: arrayUnion({
      status: "RE_ALTERATION_REQUESTED",
      note: `Free re-alteration requested: ${reason}`,
      time: new Date().toLocaleString(),
    }),
  });
}

// 8. Optional Cloudinary Image Upload
export async function uploadDesignImage(file) {
  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  if (!cloud || !preset) {
    throw new Error(
      "Cloudinary keys .env.local mein set nahi hain. Direct image URL use karein.",
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );
  if (!res.ok) throw new Error("Image upload fail ho gaya");
  const data = await res.json();
  return data.secure_url;
}
