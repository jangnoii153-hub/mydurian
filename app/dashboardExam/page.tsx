"use client";

import { useEffect, useState, Suspense } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface User {
  uid: string;
  firstName: string;
  lastName: string;
  googleSheet: string;
}

interface ChartDataRow {
  TimeStamp: string;
  อุณหภูมิ_c: number;
  อุณหภูมิดิน_c: number;
  ความชื้น_เปอร์เซ็นต์: number;
  ความชื้นดิน_เปอร์เซ็นต์: number;
  ไนโตรเจน_เปอร์เซ็นต์: number;
  ฟอสฟอรัส_เปอร์เซ็นต์: number;
  โพแทสเซียม_เปอร์เซ็นต์: number;
  PH: number;
  ความเค็ม_เปอร์เซ็นต์: number;
  ความเข้มแสง_lux: number;
  แรงดัน_hPa: number;
  ความเร็วลม_กิโลเมตรต่อชั่วโมง: number;
  ลูกลอย: number;
  [key: string]: any;
}

function DashboardExamContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [latestData, setLatestData] = useState<ChartDataRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const q = query(collection(db, "users"), where("status", "==", "user"));
      const querySnapshot = await getDocs(q);

      const userList: User[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        userList.push({
          uid: doc.id,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          googleSheet: data.googleSheet || "",
        });
      });

      setUsers(userList);
    } catch (err) {
      console.error("Error loading users:", err);
      setError("ไม่สามารถโหลดรายชื่อผู้ใช้ได้");
    }
  }

  async function handleUserChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const userId = e.target.value;
    setSelectedUser(userId);
    setError("");

    if (!userId) {
      setLatestData(null);
      return;
    }

    setLoading(true);

    try {
      const user = users.find((u) => u.uid === userId);
      if (!user || !user.googleSheet) {
        throw new Error("ไม่พบ Google Sheet URL");
      }

      const response = await fetch(user.googleSheet);
      const result = await response.json();

      let dataArray: ChartDataRow[];
      if (result.success && Array.isArray(result.data)) {
        dataArray = result.data;
      } else if (Array.isArray(result)) {
        dataArray = result;
      } else {
        throw new Error("รูปแบบข้อมูลไม่ถูกต้อง");
      }

      if (!dataArray || dataArray.length === 0) {
        throw new Error("ไม่มีข้อมูล");
      }

      // Get latest data
      const latest = dataArray[dataArray.length - 1];
      setLatestData(latest);
      setLoading(false);
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      setLatestData(null);
      setLoading(false);
    }
  }

  function createRadialChartOptions(
    label: string,
    value: number,
    min: number,
    max: number,
    unit: string
  ) {
    const percentage = ((value - min) / (max - min)) * 100;

    return {
      chart: {
        type: "radialBar" as const,
        height: 300,
        foreColor: "#ccc",
        background: "transparent",
      },
      series: [percentage],
      plotOptions: {
        radialBar: {
          hollow: { size: "70%" },
          dataLabels: {
            value: {
              show: true,
              fontSize: "22px",
              color: "#fff",
              formatter: () => `${value.toFixed(1)} ${unit}`,
            },
            name: {
              show: true,
              color: "#aaa",
              fontSize: "16px",
            },
          },
        },
      },
      labels: [label],
      colors: ["#84cc16"],
    };
  }

  const foatValue = latestData ? (latestData.ลูกลอย || 0) * 100 : 0;
  const foatText = foatValue > 0 ? "ON" : "OFF";

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
              href="/"
              className="text-white font-bold text-2xl hover:text-lime-400 transition-all font-kanit"
            >
              MyDurian
            </Link>
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden flex flex-col space-y-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="w-6 h-0.5 bg-white rounded" />
            <span className="w-6 h-0.5 bg-white rounded" />
            <span className="w-6 h-0.5 bg-white rounded" />
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            <Link
              href="/"
              className="text-gray-300 hover:text-lime-400 transition-all relative group font-kanit"
            >
              หน้าแรก
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-lime-400 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
            </Link>
            <Link
              href="/dashboardExam"
              className="text-gray-300 hover:text-lime-400 transition-all relative group font-kanit"
            >
              แดชบอร์ด
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-lime-400 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
            </Link>
            <Link
              href="/chart"
              className="text-gray-300 hover:text-lime-400 transition-all relative group font-kanit"
            >
              กราฟ
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-lime-400 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex space-x-4">
            <Link
              href="/login"
              className="px-6 py-2 text-gray-300 hover:text-white border border-transparent hover:border-lime-400 rounded-lg transition-all font-kanit"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2 bg-lime-500 text-white rounded-lg hover:bg-lime-400 transform hover:scale-105 transition-all shadow-lg hover:shadow-lime-500/30 font-kanit"
            >
              สมัครสมาชิก
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 flex flex-col gap-4 p-4 bg-gray-800/50 rounded-lg">
            <Link
              href="/"
              className="text-gray-300 hover:text-lime-400 font-kanit"
              onClick={() => setMobileMenuOpen(false)}
            >
              หน้าแรก
            </Link>
            <Link
              href="/dashboardExam"
              className="text-gray-300 hover:text-lime-400 font-kanit"
              onClick={() => setMobileMenuOpen(false)}
            >
              แดชบอร์ด
            </Link>
            <Link
              href="/chart"
              className="text-gray-300 hover:text-lime-400 font-kanit"
              onClick={() => setMobileMenuOpen(false)}
            >
              กราฟ
            </Link>
            <Link
              href="/login"
              className="text-gray-300 hover:text-lime-400 font-kanit"
              onClick={() => setMobileMenuOpen(false)}
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2 bg-lime-500 text-white rounded-lg text-center font-kanit"
              onClick={() => setMobileMenuOpen(false)}
            >
              สมัครสมาชิก
            </Link>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-20 pb-10">
        <div className="flex flex-col justify-center items-center space-y-8 px-4 md:px-28 mt-14">
          {/* User Selection */}
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-10 p-2 w-full md:w-3/4 items-center">
            <h2 className="text-3xl md:text-2xl text-white font-bold">
              เลือกผู้ใช้งาน:
            </h2>
            <select
              value={selectedUser}
              onChange={handleUserChange}
              className="w-full md:w-1/2 h-12 px-4 py-3 rounded-lg bg-slate-200 text-gray-700 border-none"
            >
              <option value="">เลือกผู้ใช้งาน</option>
              {users.map((user) => (
                <option key={user.uid} value={user.uid}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Error Message */}
          {error && <div className="text-red-500 text-xl">{error}</div>}

          {/* Loading State */}
          {loading && (
            <div className="text-white text-xl">กำลังโหลดข้อมูล...</div>
          )}

          {/* Charts */}
          {!loading && latestData && (
            <>
              {/* Temperature & Humidity */}
              <div className="w-full flex flex-col md:flex-row justify-between md:space-x-20 space-y-4 md:space-y-0">
                {/* Temperature */}
                <div className="flex flex-col w-full md:w-1/2 bg-slate-500 bg-opacity-20 rounded-lg p-6">
                  <p className="text-3xl text-white font-bold mb-4">อุณหภูมิ</p>
                  <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4">
                    <div className="w-full md:w-1/2">
                      <Chart
                        options={createRadialChartOptions(
                          "อุณหภูมิ",
                          latestData.อุณหภูมิ_c || 0,
                          0,
                          50,
                          "°C"
                        )}
                        series={[((latestData.อุณหภูมิ_c || 0) / 50) * 100]}
                        type="radialBar"
                        height={300}
                      />
                    </div>
                    <div className="w-full md:w-1/2">
                      <Chart
                        options={createRadialChartOptions(
                          "อุณหภูมิดิน",
                          latestData.อุณหภูมิดิน_c || 0,
                          0,
                          50,
                          "°C"
                        )}
                        series={[((latestData.อุณหภูมิดิน_c || 0) / 50) * 100]}
                        type="radialBar"
                        height={300}
                      />
                    </div>
                  </div>
                </div>

                {/* Humidity */}
                <div className="flex flex-col w-full md:w-1/2 bg-slate-500 bg-opacity-20 rounded-lg p-6">
                  <p className="text-3xl text-white font-bold mb-4">ความชื้น</p>
                  <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4">
                    <div className="w-full md:w-1/2">
                      <Chart
                        options={createRadialChartOptions(
                          "ความชื้น",
                          latestData.ความชื้น_เปอร์เซ็นต์ || 0,
                          0,
                          100,
                          "%"
                        )}
                        series={[latestData.ความชื้น_เปอร์เซ็นต์ || 0]}
                        type="radialBar"
                        height={300}
                      />
                    </div>
                    <div className="w-full md:w-1/2">
                      <Chart
                        options={createRadialChartOptions(
                          "ความชื้นดิน",
                          latestData.ความชื้นดิน_เปอร์เซ็นต์ || 0,
                          0,
                          100,
                          "%"
                        )}
                        series={[latestData.ความชื้นดิน_เปอร์เซ็นต์ || 0]}
                        type="radialBar"
                        height={300}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Soil Values */}
              <div className="flex flex-col w-full md:w-10/12 bg-slate-500 bg-opacity-20 rounded-lg p-6">
                <p className="text-3xl text-white font-bold mb-4">ค่าในดิน</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Chart
                    options={createRadialChartOptions(
                      "PH",
                      latestData.PH || 0,
                      0,
                      14,
                      ""
                    )}
                    series={[((latestData.PH || 0) / 14) * 100]}
                    type="radialBar"
                    height={250}
                  />
                  <Chart
                    options={createRadialChartOptions(
                      "ไนโตรเจน",
                      latestData.ไนโตรเจน_เปอร์เซ็นต์ || 0,
                      0,
                      100,
                      "ppm"
                    )}
                    series={[latestData.ไนโตรเจน_เปอร์เซ็นต์ || 0]}
                    type="radialBar"
                    height={250}
                  />
                  <Chart
                    options={createRadialChartOptions(
                      "ฟอสฟอรัส",
                      latestData.ฟอสฟอรัส_เปอร์เซ็นต์ || 0,
                      0,
                      100,
                      "ppm"
                    )}
                    series={[latestData.ฟอสฟอรัส_เปอร์เซ็นต์ || 0]}
                    type="radialBar"
                    height={250}
                  />
                  <Chart
                    options={createRadialChartOptions(
                      "โพแทสเซียม",
                      latestData.โพแทสเซียม_เปอร์เซ็นต์ || 0,
                      0,
                      100,
                      "ppm"
                    )}
                    series={[latestData.โพแทสเซียม_เปอร์เซ็นต์ || 0]}
                    type="radialBar"
                    height={250}
                  />
                </div>
              </div>

              {/* Other Values */}
              <div className="flex flex-col w-full md:w-10/12 bg-slate-500 bg-opacity-20 rounded-lg p-6">
                <p className="text-3xl text-white font-bold mb-4">ค่าอื่นๆ</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Chart
                    options={createRadialChartOptions(
                      "ความเค็ม",
                      latestData.ความเค็ม_เปอร์เซ็นต์ || 0,
                      0,
                      2,
                      "μS/cm"
                    )}
                    series={[
                      ((latestData.ความเค็ม_เปอร์เซ็นต์ || 0) / 2) * 100,
                    ]}
                    type="radialBar"
                    height={250}
                  />
                  <Chart
                    options={createRadialChartOptions(
                      "แรงดัน",
                      latestData.แรงดัน_hPa || 0,
                      900,
                      1100,
                      "hPa"
                    )}
                    series={[((latestData.แรงดัน_hPa || 0 - 900) / 200) * 100]}
                    type="radialBar"
                    height={250}
                  />
                  <Chart
                    options={createRadialChartOptions(
                      "ความเข้มแสง",
                      latestData.ความเข้มแสง_lux || 0,
                      0,
                      10000,
                      "lux"
                    )}
                    series={[((latestData.ความเข้มแสง_lux || 0) / 10000) * 100]}
                    type="radialBar"
                    height={250}
                  />
                  <Chart
                    options={createRadialChartOptions(
                      "ความเร็วลม",
                      latestData.ความเร็วลม_กิโลเมตรต่อชั่วโมง || 0,
                      0,
                      100,
                      "km/hr"
                    )}
                    series={[latestData.ความเร็วลม_กิโลเมตรต่อชั่วโมง || 0]}
                    type="radialBar"
                    height={250}
                  />
                </div>
              </div>
            </>
          )}

          {/* Initial State */}
          {!loading && !latestData && !error && (
            <div className="text-white text-xl">
              กรุณาเลือกผู้ใช้งานเพื่อแสดงข้อมูล
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/90 text-white">
        <div className="container mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">ติดต่อ</h3>
            <hr className="border-lime-500/30 w-24" />
            <ul className="space-y-4">
              <li className="text-gray-300">
                chanin.j@cit.kmutnb.ac.th (ผศ.ดร.ชานินทร์ จูฉิม)
              </li>
              <li className="text-gray-300">
                supod.k@cit.kmutnb.ac.th (ผศ.ดร.สุพจน์ แก้วกรณ์)
              </li>
            </ul>
          </div>
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">หน่วยงานที่เกี่ยวข้อง</h3>
            <hr className="border-lime-500/30 w-24" />
            <ul className="space-y-4">
              <li>
                <a
                  href="https://www.doae.go.th/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-lime-400"
                >
                  กรมส่งเสริมการเกษตร
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">สถานที่</h3>
            <hr className="border-lime-500/30 w-24" />
            <ul className="space-y-4">
              <li>
                <a
                  href="https://www.google.com/maps/place/มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-lime-400"
                >
                  1518 ถนนประชาราษฎร์ 1 แขวงวงศ์สว่าง เขตบางซื่อ กรุงเทพฯ 10800
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800">
          <div className="container mx-auto px-8 py-6">
            <p className="text-sm text-gray-400">
              © MyDurian - King Mongkut&apos;s University of Technology North
              Bangkok
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function DashboardExamPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-white">
          Loading...
        </div>
      }
    >
      <DashboardExamContent />
    </Suspense>
  );
}
