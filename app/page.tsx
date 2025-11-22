"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface User {
  uid: string;
  placeName: string;
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

export default function Home() {
  // States
  const [currentSlide, setCurrentSlide] = useState(0);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const totalSlides = 2;

  // Carousel auto-play
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Load map pins
  useEffect(() => {
    loadPins();
  }, []);

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

  const examples = [
    {
      id: 1,
      src: "https://www.robotoops.com/imagesMydurian/forindex/news2.jpg",
      alt: "Example 1",
      description: "ระบบควบคุมการให้น้ำอัตโนมัติในสวนทุเรียน",
    },
    {
      id: 2,
      src: "https://www.robotoops.com/imagesMydurian/forindex/news3.jpg",
      alt: "Example 2",
      description: "ระบบติดตามสุขภาพต้นทุเรียนแบบเรียลไทม์",
    },
    {
      id: 3,
      src: "https://www.robotoops.com/imagesMydurian/forindex/post_pic3.jpg",
      alt: "Example 3",
      description: "ระบบแจ้งเตือนปัญหาโรคและแมลงศัตรูพืช",
    },
  ];

  return (
    <>
      <Navbar />
      {/* Hero Carousel */}
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{
            width: `${totalSlides * 100}%`,
            transform: `translateX(-${currentSlide * (100 / totalSlides)}%)`,
          }}
        >
          {/* Slide 1 */}
          <section className="min-h-screen w-full flex items-center justify-between px-8 md:px-20 bg-black/90">
            <div className="flex-1 space-y-8 mt-20 max-w-2xl text-white font-prompt">
              <h1 className="text-4xl md:text-7xl font-bold tracking-tight">
                SMART FARM <span className="text-lime-400">KMUTNB</span>
              </h1>
              <h2 className="text-3xl md:text-5xl font-light text-white/90">
                for Nontaburi farmers
              </h2>
              <div className="space-y-3 text-gray-400 font-light">
                <p className="text-xl">โครงการสมาร์ทฟาร์มพัฒนาการเกษตร</p>
                <p className="text-xl">
                  ภายใต้ความร่วมมือระหว่าง กระทรวงเกษตรนนทบุรีและ
                </p>
                <p className="text-xl">
                  มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
                </p>
              </div>
            </div>
            <div className="hidden md:block max-w-xl">
              <img
                src="https://www.robotoops.com/MyDurian-KMUTNB/assets/images/icon_durian.png"
                alt="Durian"
                className="w-full scale-80 hover:scale-[1.55] transition-transform"
              />
            </div>
          </section>

          {/* Slide 2 */}
          <section className="min-h-screen w-full flex items-center justify-between px-8 md:px-20 bg-gradient-to-r from-black/90 to-fuchsia-900/90">
            <div className="flex-1 space-y-8 mt-20 max-w-2xl text-white font-prompt">
              <h1 className="text-4xl md:text-7xl font-bold tracking-tight">
                SMART FARM <span className="text-lime-400">KMUTNB</span>
              </h1>
              <h2 className="text-3xl md:text-5xl font-light text-white/90">
                for Nontaburi farmers
              </h2>
              <div className="space-y-3 text-gray-400 font-light">
                <p className="text-xl">โครงการสมาร์ทฟาร์มพัฒนาการเกษตร</p>
                <p className="text-xl">
                  ภายใต้ความร่วมมือระหว่าง กระทรวงเกษตรนนทบุรีและ
                </p>
                <p className="text-xl">
                  มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
                </p>
              </div>
            </div>
            <div className="hidden md:block max-w-xl">
              <img
                src="/images/smart_pic_use3.png"
                alt="Smart Farm"
                className="w-full scale-80 hover:scale-[1.55] transition-transform"
              />
            </div>
          </section>
        </div>

        {/* Navigation dots */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
          {[0, 1].map((idx) => (
            <button
              key={idx}
              className={`w-20 h-2 rounded-full transition-all ${
                currentSlide === idx
                  ? "bg-lime-400 scale-110"
                  : "bg-white/30 hover:bg-white/50"
              }`}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Example Solutions */}
      <section className="bg-neutral-900/50 py-24 px-8 md:px-20">
        <h2 className="text-4xl text-white font-bold mb-16 text-center">
          Example Solutions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {examples.map((example) => (
            <div
              key={example.id}
              className="bg-white/5 backdrop-blur-lg rounded-xl overflow-hidden shadow-xl hover:shadow-lime-500/20 transform hover:scale-105 transition-all duration-300"
            >
              <img
                src={example.src}
                alt={example.alt}
                className="w-full h-48 object-cover hover:opacity-90 transition-opacity"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white">
                  Example {example.id}
                </h3>
                <p className="mt-2 text-gray-400">{example.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-8 md:px-20 bg-black/80">
        <div className="flex flex-col md:flex-row justify-between gap-16">
          <div className="md:w-1/2 space-y-8 text-white">
            <h2 className="text-5xl font-bold text-lime-400">Benefits</h2>
            <div className="space-y-6">
              <p className="text-xl leading-relaxed">
                ผู้ใช้บริการหลังจากลงทะเบียนเป็นสมาชิกแล้ว
                สามารถดูข้อมูลแบบเรียลไทม์จากเซ็นเซอร์ที่ติดตั้งในฟาร์มทุเรียน
                ผ่านทางเว็บไซต์ซึ่งมีทั้งแดชบอร์ดและกราฟ
              </p>
              <p className="text-xl leading-relaxed">
                ผู้ใช้ยังสามารถดาวน์โหลดข้อมูลเป็นไฟล์ CSV
                เพื่อนำไปใช้ต่อและดูข้อมูลย้อนหลังพร้อมรับการแจ้งเตือนผ่าน Line
                Notify ได้อีกด้วย
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-8">
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-lime-500 text-white rounded-lg hover:bg-lime-400 transform hover:scale-105 transition-all shadow-lg hover:shadow-lime-500/30 text-center"
              >
                ตัวอย่างแดชบอร์ด
              </Link>
              <Link
                href="/chart"
                className="px-8 py-4 bg-lime-500 text-white rounded-lg hover:bg-lime-400 transform hover:scale-105 transition-all shadow-lg hover:shadow-lime-500/30 text-center"
              >
                ตัวอย่างกราฟ
              </Link>
            </div>
          </div>

          <div className="md:w-1/2 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl overflow-hidden shadow-xl hover:shadow-lime-500/20 transform hover:scale-105 transition-all duration-300">
              <img
                src="https://robotoops.com/imagesMydurian/forindex/temp-dashboard.jfif"
                alt="Dashboard"
                className="w-full h-48 object-cover hover:opacity-90 transition-opacity"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white">Dashboard</h3>
                <p className="mt-2 text-gray-400">
                  Interactive and customizable dashboard for data visualization.
                </p>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-xl overflow-hidden shadow-xl hover:shadow-lime-500/20 transform hover:scale-105 transition-all duration-300">
              <img
                src="https://robotoops.com/imagesMydurian/forindex/chart.jfif"
                alt="Chart"
                className="w-full h-48 object-cover hover:opacity-90 transition-opacity"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white">Chart</h3>
                <p className="mt-2 text-gray-400">
                  Interactive and customizable chart for data visualization.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <div className="w-full bg-slate-100 py-16 px-8 md:px-28">
        <h2 className="text-5xl font-bold text-gray-800 mb-10">ภาพรวม</h2>
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

      <Footer />
    </>
  );
}
