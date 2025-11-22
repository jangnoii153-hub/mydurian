"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import Footer from "@/components/Footer";

interface User {
  uid: string;
  placeNo?: string;
  placeName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  poles?: number;
  googleSheet?: string;
  googleMap?: string;
  durian1?: string;
  durian2?: string;
  durian3?: string;
  [key: string]: any;
}

interface MapPin {
  id: string;
  placeName: string;
  poleNumber: number;
  x: number;
  y: number;
}

function AdminSettingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pins, setPins] = useState<MapPin[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Form states
  const [placeNo, setPlaceNo] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [poles, setPoles] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userUid, setUserUid] = useState("");
  const [googleSheet, setGoogleSheet] = useState("");
  const [googleMap, setGoogleMap] = useState("");
  const [durian1, setDurian1] = useState("");
  const [durian2, setDurian2] = useState("");
  const [durian3, setDurian3] = useState("");

  useEffect(() => {
    if (!uid) {
      router.push("/login");
      return;
    }
    fetchUsers();
  }, [uid]);

  useEffect(() => {
    if (selectedUserId) {
      loadUserData(selectedUserId);
    }
  }, [selectedUserId]);

  async function fetchUsers() {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersData: User[] = [];
      usersSnapshot.forEach((doc) => {
        usersData.push({ uid: doc.id, ...doc.data() } as User);
      });
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }

  async function loadUserData(userId: string) {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = { uid: userDoc.id, ...userDoc.data() } as User;
        setSelectedUser(userData);

        // Set form values
        setPlaceNo(userData.placeNo || "");
        setPlaceName(userData.placeName || "");
        setPoles(userData.poles?.toString() || "");
        setFirstName(userData.firstName || "");
        setLastName(userData.lastName || "");
        setEmail(userData.email || "");
        setUserUid(userData.uid || "");
        setGoogleSheet(userData.googleSheet || "");
        setGoogleMap(userData.googleMap || "");
        setDurian1(userData.durian1 || "");
        setDurian2(userData.durian2 || "");
        setDurian3(userData.durian3 || "");

        // Create pins for map
        createPinsForUser(userData);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }

  function createPinsForUser(user: User) {
    const userPins: MapPin[] = [];
    const poleCount = user.poles || 0;

    for (let i = 1; i <= poleCount; i++) {
      const xField = `coordinate_x_${user.placeName}_${i}`;
      const yField = `coordinate_y_${user.placeName}_${i}`;

      userPins.push({
        id: `${user.uid}_${user.placeName}_${i}`,
        placeName: user.placeName || "",
        poleNumber: i,
        x: user[xField] ?? 50,
        y: user[yField] ?? 50,
      });
    }

    setPins(userPins);
  }

  function enableDrag(pinElement: HTMLDivElement, pin: MapPin) {
    let isDragging = false;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      isDragging = true;

      const mouseMoveHandler = (ev: MouseEvent) => {
        if (!isDragging || !mapContainerRef.current) return;

        const rect = mapContainerRef.current.getBoundingClientRect();
        let x = ((ev.clientX - rect.left) / rect.width) * 100;
        let y = ((ev.clientY - rect.top) / rect.height) * 100;

        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));

        pin.x = x;
        pin.y = y;

        pinElement.style.left = `${x}%`;
        pinElement.style.top = `${y}%`;
      };

      const mouseUpHandler = () => {
        isDragging = false;
        document.removeEventListener("mousemove", mouseMoveHandler);
        document.removeEventListener("mouseup", mouseUpHandler);
      };

      document.addEventListener("mousemove", mouseMoveHandler);
      document.addEventListener("mouseup", mouseUpHandler);
    };

    pinElement.addEventListener("mousedown", handleMouseDown as any);
  }

  async function handleSave() {
    if (!selectedUserId) {
      alert("กรุณาเลือกผู้ใช้");
      return;
    }

    try {
      const updateData: any = {
        placeNo,
        placeName,
        poles: parseInt(poles) || 0,
        firstName,
        lastName,
        email,
        googleSheet,
        googleMap,
        durian1,
        durian2,
        durian3,
      };

      // Save pin coordinates
      pins.forEach((pin) => {
        updateData[`coordinate_x_${pin.placeName}_${pin.poleNumber}`] = pin.x;
        updateData[`coordinate_y_${pin.placeName}_${pin.poleNumber}`] = pin.y;
      });

      await updateDoc(doc(db, "users", selectedUserId), updateData);

      alert("บันทึกข้อมูลสำเร็จ!");
      fetchUsers();
    } catch (error) {
      console.error("Error saving user data:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  }

  if (!uid) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black font-noto">
      {/* Navigation */}
      <nav className="bg-gray-900/95 backdrop-blur-md p-4 w-full fixed z-50 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src="https://www.robotoops.com/MyDurian-KMUTNB/assets/images/icon_durian.png"
              className="w-12 h-12 hover:scale-110 transition-transform"
              alt="MyDurian Logo"
            />
            <Link
              href={`/admins/admin?uid=${uid}`}
              className="text-white font-bold text-2xl hover:text-lime-400 transition-all font-kanit"
            >
              MyDurian
            </Link>
          </div>

          <div className="hidden md:flex space-x-8">
            <Link
              href={`/admins/admin?uid=${uid}`}
              className="text-gray-300 hover:text-lime-400 transition-all relative group font-kanit"
            >
              หน้าแรก
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-lime-400 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
            </Link>

            <Link
              href={`/admins/adminsetting?uid=${uid}`}
              className="text-gray-300 hover:text-lime-400 transition-all relative group font-kanit"
            >
              ตั้งค่ายูเซอร์
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-lime-400 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
            </Link>

            <Link
              href={`/admins/add_admin?uid=${uid}`}
              className="text-gray-300 hover:text-lime-400 transition-all relative group font-kanit"
            >
              เพิ่มแอดมิน
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-lime-400 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-10">
        <div className="flex flex-col justify-center items-center space-y-8 p-8 md:p-20">
          {/* Select Users */}
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-10 p-2 w-full md:w-3/4">
            <h2 className="text-2xl text-white font-bold">Select Users :</h2>

            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full md:w-1/2 px-4 py-3 rounded-lg bg-slate-200 text-gray-500 border-none"
            >
              <option value="">Select Users</option>
              {users.map((user) => (
                <option key={user.uid} value={user.uid}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {/* ----- FORM FIELDS ----- */}
          {[
            { label: "Place No", value: placeNo, setter: setPlaceNo },
            { label: "Place", value: placeName, setter: setPlaceName },
            { label: "Pole", value: poles, setter: setPoles },
            { label: "Email", value: email, setter: setEmail },
            { label: "Password", value: password, setter: setPassword },
            {
              label: "GoogleSheet URL",
              value: googleSheet,
              setter: setGoogleSheet,
            },
            { label: "Google Map", value: googleMap, setter: setGoogleMap },
          ].map((field, idx) => (
            <div
              key={idx}
              className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-10 p-2 w-full md:w-3/4"
            >
              <label className="block text-lg text-gray-200 md:w-1/6">
                {field.label} :
              </label>
              <input
                type="text"
                value={field.value}
                onChange={(e) => field.setter(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-300/20 text-white placeholder-gray-400"
              />
            </div>
          ))}

          {/* UID */}
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-10 p-2 w-full md:w-3/4">
            <label className="block text-lg text-gray-200 md:w-1/6">
              UID :
            </label>
            <input
              type="text"
              value={userUid}
              readOnly
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-300/20 text-white opacity-70"
            />
          </div>

          {/* Durian Types */}
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-10 p-2 w-full md:w-3/4">
            {[
              { label: "Durian1", value: durian1, setter: setDurian1 },
              { label: "Durian2", value: durian2, setter: setDurian2 },
              { label: "Durian3", value: durian3, setter: setDurian3 },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full"
              >
                <label className="block text-lg text-gray-200 md:w-3/6">
                  {item.label} :
                </label>
                <input
                  type="text"
                  value={item.value}
                  onChange={(e) => item.setter(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-300/20 text-white"
                />
              </div>
            ))}
          </div>

          {/* Map */}
          <h2 className="text-2xl text-white font-bold mb-2 md:w-3/4">
            User Map
          </h2>
          <div
            ref={mapContainerRef}
            className="relative w-full md:w-3/4 h-96 overflow-hidden rounded-lg bg-gray-800"
          >
            <img
              src="https://www.robotoops.com//MyDurian-KMUTNB/assets/images/nontaburi.png"
              className="w-full h-full object-contain"
              alt="Map Image"
            />

            {pins.map((pin) => (
              <div
                key={pin.id}
                className="absolute cursor-grab z-10 hover:scale-110 transition-transform"
                style={{
                  left: `${pin.x}%`,
                  top: `${pin.y}%`,
                  transform: "translate(-50%, -100%)",
                }}
                ref={(el) => {
                  if (el) enableDrag(el, pin);
                }}
              >
                <img
                  src="https://cdn-icons-png.flaticon.com/512/684/684908.png"
                  className="w-8 h-8"
                  alt="Pin"
                />
              </div>
            ))}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="px-8 py-4 w-full md:w-1/6 bg-lime-500 text-white rounded-lg hover:bg-lime-400 transform hover:scale-105 transition-all shadow-lg"
          >
            Save
          </button>

          <hr className="border-lime-500/30 w-full" />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function AdminSettingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-white text-xl">กำลังโหลด...</div>
        </div>
      }
    >
      <AdminSettingContent />
    </Suspense>
  );
}
