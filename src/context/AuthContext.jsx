import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) setUserData(snap.data());
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function signup({
    email,
    password,
    name,
    phone,
    role,
    shopName,
    pincode,
  }) {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const uid = res.user.uid;

    const profile = {
      uid,
      name,
      phone,
      email,
      role,
      pincode: pincode || "800001",
      createdAtMs: Date.now(),
    };
    await setDoc(doc(db, "users", uid), profile);

    // Agar user Tailor hai toh automatic starter shop aur rate card ban jayega
    if (role === "tailor") {
      await setDoc(doc(db, "tailors", uid), {
        tailorId: uid,
        ownerName: name,
        phone,
        shopName: shopName || `${name}'s Boutique`,
        pincode: pincode || "800001",
        specialty: ["Suit", "Blouse", "Kurta", "Alteration"],
        isAcceptingOrders: true,
        dailyMaxOrders: 6,
        todayOrderCount: 0,
        rating: 4.9,
        catalog: [
          {
            id: "srv_1",
            name: "Simple Suit Stitching",
            basePrice: 500,
            days: 4,
          },
          { id: "srv_2", name: "Astar (Lining) Suit", basePrice: 800, days: 5 },
          { id: "srv_3", name: "Designer Blouse", basePrice: 650, days: 3 },
          {
            id: "srv_4",
            name: "Pant / Kurta Alteration",
            basePrice: 120,
            days: 1,
          },
        ],
      });
    }

    setUserData(profile);
    return profile;
  }

  async function login(email, password) {
    const res = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, "users", res.user.uid));
    if (snap.exists()) setUserData(snap.data());
    return res;
  }

  function logout() {
    return signOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{ user, userData, loading, signup, login, logout }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}
