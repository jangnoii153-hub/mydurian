"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import Footer from "@/components/Footer";

interface User {
  uid: string;
  placeNo?: string;
  placeName: string;
  firstName?: string;
  poles: number;
  status: string;
  [key: string]: any;
}

interface MapPin {
  id: string;
  uid: string;
  placeName: string;
  poleNumber: number;
  x: number;
  y: number;
}

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");

  const [users, setUsers] = useState<User[]>([]);
  const [pins, setPins] = useState<MapPin[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!uid) {
      router.push("/login");
      return;
    }
    fetchUsers();
    loadPins();
  }, [uid]);

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

  async function loadPins() {
    try {
      const q = query(collection(db, "users"), where("status", "==", "user"));
      const usersSnap = await getDocs(q);

      const usersData: User[] = [];
      usersSnap.forEach((docSnap) => {
        usersData.push({ uid: docSnap.id, ...docSnap.data() } as User);
      });

      const allPins = createPinsFromUsers(usersData);
      setPins(allPins);
    } catch (err) {
      console.error("Error loading users:", err);
    }
  }

  function createPinsFromUsers(users: User[]): MapPin[] {
    const allPins: MapPin[] = [];
    users.forEach((user) => {
      for (let i = 1; i <= user.poles; i++) {
        const pinId = `${user.uid}_${user.placeName}_${i}`;
        const xField = `coordinate_x_${user.placeName}_${i}`;
        const yField = `coordinate_y_${user.placeName}_${i}`;
        allPins.push({
          id: pinId,
          uid: user.uid,
          placeName: user.placeName,
          poleNumber: i,
          x: user[xField] ?? 50,
          y: user[yField] ?? 50,
        });
      }
    });
    return allPins;
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

  async function savePinPositions() {
    try {
      const updatesByUser: { [uid: string]: any } = {};

      pins.forEach((pin) => {
        if (!updatesByUser[pin.uid]) updatesByUser[pin.uid] = {};
        updatesByUser[pin.uid][
          `coordinate_x_${pin.placeName}_${pin.poleNumber}`
        ] = pin.x;
        updatesByUser[pin.uid][
          `coordinate_y_${pin.placeName}_${pin.poleNumber}`
        ] = pin.y;
      });

      for (const [uid, updates] of Object.entries(updatesByUser)) {
        await setDoc(doc(db, "users", uid), updates, { merge: true });
      }

      alert("Positions saved successfully!");
    } catch (error) {
      console.error("Error saving positions:", error);
      alert("Error saving positions");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black font-noto">
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

          <div className="hidden md:flex space-x-4">
            <Link
              href="/"
              className="px-6 py-2 text-gray-300 hover:text-white border border-transparent hover:border-lime-400 rounded-lg transition-all font-kanit"
            >
              ออกจากระบบ
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-10">
        <div className="w-full h-full bg-slate-100 flex flex-col space-y-16 px-8 md:px-28">
          <div className="flex mt-20 justify-between">
            <h2 className="text-2xl text-gray-700 font-bold mb-2 text-start">
              All Stations
            </h2>
            <button
              onClick={savePinPositions}
              className="px-8 py-4 w-1/6 bg-lime-500 mt-6 text-white rounded-lg hover:bg-lime-400 transform hover:scale-105 transition-all shadow-lg hover:shadow-lime-500/30"
            >
              Save
            </button>
          </div>

          <div
            ref={mapContainerRef}
            className="relative w-full aspect-[16/9] overflow-hidden rounded-lg justify-center items-center"
          >
            <img
              src="https://www.robotoops.com//MyDurian-KMUTNB/assets/images/nontaburi.png"
              alt="Map Image"
              className="w-full h-full object-contain"
            />

            {pins.map((pin) => (
              <div
                key={pin.id}
                className="absolute cursor-grab z-10 transition-transform hover:scale-110"
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
                  alt="Map Pin"
                  className="w-8 h-8 drop-shadow-lg"
                />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black text-white px-3 py-2 rounded text-sm whitespace-nowrap shadow-lg opacity-0 hover:opacity-100 transition-opacity">
                  {pin.placeName}, Pole {pin.poleNumber}
                </div>
              </div>
            ))}
          </div>

          <div className="p-10">
            <h2 className="text-3xl font-bold mb-6 text-gray-700">
              User Table
            </h2>
            <div className="bg-white p-4 rounded-lg shadow-lg overflow-x-auto">
              <table className="min-w-full border border-gray-800 border-collapse rounded-lg overflow-hidden shadow-md">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-4 py-2 border border-gray-300 text-left text-gray-600 font-medium">
                      Place No
                    </th>
                    <th className="px-4 py-2 border border-gray-300 text-left text-gray-600 font-medium">
                      Place Name
                    </th>
                    <th className="px-4 py-2 border border-gray-300 text-left text-gray-600 font-medium">
                      FirstName
                    </th>
                    <th className="px-4 py-2 border border-gray-300 text-left text-gray-600 font-medium">
                      Pole
                    </th>
                    <th className="px-4 py-2 border border-gray-300 text-left text-gray-600 font-medium">
                      Status
                    </th>
                    <th className="px-4 py-2 border border-gray-300 text-left text-gray-600 font-medium">
                      UserPage
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user.uid} className="bg-white hover:bg-gray-100">
                      <td className="px-4 py-2 border border-gray-300">
                        {user.placeNo || "-"}
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        {user.placeName || "-"}
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        {user.firstName || "-"}
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        {user.poles || "-"}
                      </td>
                      <td className="px-4 py-2 border border-gray-300">Good</td>
                      <td
                        className="px-4 py-2 border border-gray-300 cursor-pointer text-blue-600 hover:text-blue-800"
                        onClick={() =>
                          router.push(`/users/home?uid=${user.uid}`)
                        }
                      >
                        {user.firstName || "-"} Page
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-white text-xl">กำลังโหลด...</div>
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
