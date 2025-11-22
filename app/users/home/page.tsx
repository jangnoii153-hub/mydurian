"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import NavbarUser from "@/components/NavbarUser";
import Footer from "@/components/Footer";

interface User {
  uid: string;
  placeName: string;
  poles: number;
  status: string;
  firstName?: string;
  map?: string;
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

function HomeContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");

  const [userData, setUserData] = useState<User | null>(null);
  const [mapUrl, setMapUrl] = useState<string>("");
  const [mapLoading, setMapLoading] = useState(true);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Load user info
  useEffect(() => {
    if (!uid) return;
    loadUserInfo();
    loadPins();
  }, [uid]);

  async function loadUserInfo() {
    try {
      const docRef = doc(db, "users", uid!);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as User;
        setUserData(data);

        if (data.map) {
          setMapUrl(data.map);
          setMapLoading(false);
        } else {
          setMapLoading(false);
        }
      }
    } catch (err) {
      console.error("Error loading user info:", err);
      setMapLoading(false);
    }
  }

  async function loadPins() {
    try {
      const q = query(collection(db, "users"), where("status", "==", "user"));
      const usersSnap = await getDocs(q);

      const users: User[] = [];
      usersSnap.forEach((docSnap) => {
        users.push({ uid: docSnap.id, ...docSnap.data() } as User);
      });

      const allPins = createPinsFromUsers(users);
      setPins(allPins);
    } catch (err) {
      console.error("Error loading pins:", err);
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

  return (
    <>
      <NavbarUser />
      <main className="pt-2 pb-10">
        <div className="text-white text-center mt-2 text-xl">
          {/* Info Boxes */}
          <div className="flex justify-center items-center mt-20 px-4 space-x-12 mb-4">
            {/* User */}
            <div className="flex items-center space-x-4">
              <img
                src="https://www.robotoops.com/MyDurian-KMUTNB/assets/images/user.png"
                className="w-16 h-16"
                alt="User Icon"
              />
              <p className="text-lg text-gray-300">
                {userData?.firstName || "ไม่ระบุชื่อ"}
              </p>
            </div>

            {/* Poles */}
            <div className="flex items-center space-x-4">
              <img
                src="https://www.robotoops.com/MyDurian-KMUTNB/assets/images/electric-pole.png"
                className="w-16 h-16"
                alt="Poles Icon"
              />
              <p className="text-lg text-gray-300">{userData?.poles || 0}</p>
            </div>
          </div>

          {/* Weather iframe */}
          <div className="w-full flex justify-center mt-10">
            <iframe
              src="https://www.tmd.go.th/weatherForecast7DaysWidget?province=นนทบุรี"
              frameBorder="0"
              className="w-full h-96 rounded-lg"
            />
          </div>

          {/* User Map */}
          <h2 className="text-2xl font-bold mt-10 mb-4">แผนที่ผู้ใช้งาน</h2>

          {mapLoading ? (
            <div className="relative w-full h-96 overflow-hidden rounded-lg bg-gray-800 grid place-items-center">
              <div className="animate-pulse text-gray-400">
                กำลังโหลดแผนที่…
              </div>
            </div>
          ) : mapUrl ? (
            <div className="relative w-full h-96 overflow-hidden rounded-lg pt-4 px-4">
              <img
                src={mapUrl}
                alt="User Map"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          ) : (
            <div className="relative w-full h-96 overflow-hidden rounded-lg bg-gray-800 grid place-items-center">
              <div className="text-gray-400">ไม่มีแผนที่</div>
            </div>
          )}

          {/* Overall Map */}
          <h2 className="text-2xl font-bold mt-10 mb-4">ภาพรวม</h2>
          <div className="w-full bg-slate-100 flex flex-col space-y-16 px-8 md:px-28 py-10">
            <section className="pb-10">
              <div
                ref={mapContainerRef}
                className="relative w-full aspect-[16/9] overflow-hidden rounded-lg"
              >
                <img
                  src="https://www.robotoops.com//MyDurian-KMUTNB/assets/images/nontaburi.png"
                  alt="Nontaburi Map"
                  className="w-full h-full object-contain"
                />

                {/* Map Pins */}
                {pins.map((pin) => (
                  <div
                    key={pin.id}
                    className="absolute cursor-pointer z-10 transition-transform hover:scale-110"
                    style={{
                      left: `${pin.x}%`,
                      top: `${pin.y}%`,
                      transform: "translate(-50%, -100%)",
                    }}
                    onMouseEnter={() => setHoveredPin(pin.id)}
                    onMouseLeave={() => setHoveredPin(null)}
                  >
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/684/684908.png"
                      alt="Map Pin"
                      width={32}
                      height={32}
                      className="drop-shadow-lg"
                    />

                    {hoveredPin === pin.id && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black text-white px-3 py-2 rounded text-sm whitespace-nowrap shadow-lg">
                        {pin.placeName}, Pole {pin.poleNumber}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                          <div className="border-4 border-transparent border-t-black" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-white text-xl">กำลังโหลด...</div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
