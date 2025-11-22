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
  [key: string]: any;
}

function DashboardExamContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [chartData, setChartData] = useState<ChartDataRow[]>([]);
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
      setChartData([]);
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

      setChartData(dataArray);
      setLoading(false);
    } catch (err: any) {
      console.error("Error loading chart data:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      setChartData([]);
      setLoading(false);
    }
  }

  function parseTimestamp(ts: string): Date {
    if (!ts) return new Date();

    try {
      // Format 1: "2025-01-22 19:36:00" (ISO-like format)
      if (ts.includes("-") && ts.includes(":")) {
        const [datePart, timePart] = ts.split(" ");
        const [year, month, day] = datePart.split("-").map(Number);
        const [hour, minute, second] = timePart.split(":").map(Number);
        return new Date(year, month - 1, day, hour, minute, second || 0);
      }

      // Format 2: "06/19/2025, 00:35" (MM/DD/YYYY, HH:mm)
      if (ts.includes(",")) {
        const [datePart, timePart] = ts.split(",");
        const [a, b, c] = datePart.trim().split("/").map(Number);
        const [hour, minute] = timePart
          ? timePart.trim().split(":").map(Number)
          : [0, 0];

        let year, month, day;
        // ถ้า a > 12 แสดงว่าเป็น day
        if (a > 12) {
          day = a;
          month = b;
          year = c;
        } else {
          // ถ้า a <= 12 อาจเป็น MM/DD/YYYY
          month = a;
          day = b;
          year = c;
        }
        return new Date(year, month - 1, day, hour, minute);
      }

      // Fallback: ลองใช้ Date.parse
      const parsed = new Date(ts);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }

      return new Date();
    } catch (e) {
      console.warn("Failed to parse timestamp:", ts, e);
      return new Date();
    }
  }

  function createChartOptions(series: any[], title: string) {
    return {
      chart: {
        type: "line" as const,
        height: 350,
        background: "transparent",
        toolbar: { show: true },
      },
      stroke: { curve: "smooth" as const, width: 2 },
      markers: { size: 4 },
      dataLabels: { enabled: false },
      xaxis: {
        type: "datetime" as const,
        labels: { style: { colors: "#fff" } },
      },
      yaxis: { labels: { style: { colors: "#fff" } } },
      tooltip: { theme: "dark" },
      grid: { borderColor: "#535A6C" },
      colors: [
        "#facc15",
        "#22d3ee",
        "#34d399",
        "#3b82f6",
        "#8b5cf6",
        "#f87171",
      ],
      series: series,
      title: {
        text: title,
        style: { color: "#fff" },
      },
    };
  }

  const displayDate =
    chartData.length > 0
      ? parseTimestamp(
          chartData[chartData.length - 1].TimeStamp
        ).toLocaleDateString("th-TH", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";

  // Prepare chart series
  const tempSeries = chartData.length
    ? [
        {
          name: "อุณหภูมิ (°C)",
          data: chartData.map((r) => [
            parseTimestamp(r.TimeStamp).getTime(),
            r.อุณหภูมิ_c || 0,
          ]),
        },
        {
          name: "อุณหภูมิดิน (°C)",
          data: chartData.map((r) => [
            parseTimestamp(r.TimeStamp).getTime(),
            r.อุณหภูมิดิน_c || 0,
          ]),
        },
      ]
    : [];

  const humiSeries = chartData.length
    ? [
        {
          name: "ความชื้น (%)",
          data: chartData.map((r) => [
            parseTimestamp(r.TimeStamp).getTime(),
            r.ความชื้น_เปอร์เซ็นต์ || 0,
          ]),
        },
        {
          name: "ความชื้นดิน (%)",
          data: chartData.map((r) => [
            parseTimestamp(r.TimeStamp).getTime(),
            r.ความชื้นดิน_เปอร์เซ็นต์ || 0,
          ]),
        },
      ]
    : [];

  const mattersSeries = chartData.length
    ? [
        {
          name: "ไนโตรเจน (%)",
          data: chartData.map((r) => [
            parseTimestamp(r.TimeStamp).getTime(),
            r.ไนโตรเจน_เปอร์เซ็นต์ || 0,
          ]),
        },
        {
          name: "ฟอสฟอรัส (%)",
          data: chartData.map((r) => [
            parseTimestamp(r.TimeStamp).getTime(),
            r.ฟอสฟอรัส_เปอร์เซ็นต์ || 0,
          ]),
        },
        {
          name: "โพแทสเซียม (%)",
          data: chartData.map((r) => [
            parseTimestamp(r.TimeStamp).getTime(),
            r.โพแทสเซียม_เปอร์เซ็นต์ || 0,
          ]),
        },
      ]
    : [];

  const phSeries = chartData.length
    ? [
        {
          name: "PH",
          data: chartData.map((r) => [
            parseTimestamp(r.TimeStamp).getTime(),
            r.PH || 0,
          ]),
        },
      ]
    : [];

  const secSeries = chartData.length
    ? [
        {
          name: "ความเค็ม (%)",
          data: chartData.map((r) => [
            parseTimestamp(r.TimeStamp).getTime(),
            r.ความเค็ม_เปอร์เซ็นต์ || 0,
          ]),
        },
      ]
    : [];

  const othersSeries = chartData.length
    ? [
        {
          name: "ความเข้มแสง (lux)",
          data: chartData.map((r) => [
            parseTimestamp(r.TimeStamp).getTime(),
            r.ความเข้มแสง_lux || 0,
          ]),
        },
        {
          name: "แรงดัน (hPa)",
          data: chartData.map((r) => [
            parseTimestamp(r.TimeStamp).getTime(),
            r.แรงดัน_hPa || 0,
          ]),
        },
        {
          name: "ความเร็วลม (km/h)",
          data: chartData.map((r) => [
            parseTimestamp(r.TimeStamp).getTime(),
            r.ความเร็วลม_กิโลเมตรต่อชั่วโมง || 0,
          ]),
        },
      ]
    : [];

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
            <span className="w-6 h-0.5 bg-white" />
            <span className="w-6 h-0.5 bg-white" />
            <span className="w-6 h-0.5 bg-white" />
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
            >
              หน้าแรก
            </Link>
            <Link
              href="/dashboardExam"
              className="text-gray-300 hover:text-lime-400 font-kanit"
            >
              แดชบอร์ด
            </Link>
            <Link
              href="/chart"
              className="text-gray-300 hover:text-lime-400 font-kanit"
            >
              กราฟ
            </Link>
            <Link
              href="/login"
              className="text-gray-300 hover:text-lime-400 font-kanit"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2 bg-lime-500 text-white rounded-lg text-center font-kanit"
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
          {!loading && chartData.length > 0 && (
            <div className="w-full space-y-16">
              {/* Temperature Chart */}
              <div className="space-y-5">
                <div className="flex flex-col md:flex-row md:space-x-5 items-baseline">
                  <h2 className="text-3xl md:text-2xl text-white font-bold">
                    กราฟอุณหภูมิ
                  </h2>
                  <p className="text-xl text-gray-300">วันที่: {displayDate}</p>
                </div>
                <Chart
                  options={createChartOptions(tempSeries, "")}
                  series={tempSeries}
                  type="line"
                  height={350}
                />
              </div>

              {/* Humidity Chart */}
              <div className="space-y-5">
                <div className="flex flex-col md:flex-row md:space-x-5 items-baseline">
                  <h2 className="text-3xl md:text-2xl text-white font-bold">
                    กราฟความชื้น
                  </h2>
                  <p className="text-xl text-gray-300">วันที่: {displayDate}</p>
                </div>
                <Chart
                  options={createChartOptions(humiSeries, "")}
                  series={humiSeries}
                  type="line"
                  height={350}
                />
              </div>

              {/* Matters Chart */}
              <div className="space-y-5">
                <div className="flex flex-col md:flex-row md:space-x-5 items-baseline">
                  <h2 className="text-3xl md:text-2xl text-white font-bold">
                    กราฟค่าสารในดิน
                  </h2>
                  <p className="text-xl text-gray-300">วันที่: {displayDate}</p>
                </div>
                <Chart
                  options={createChartOptions(mattersSeries, "")}
                  series={mattersSeries}
                  type="line"
                  height={350}
                />
              </div>

              {/* PH Chart */}
              <div className="space-y-5">
                <div className="flex flex-col md:flex-row md:space-x-5 items-baseline">
                  <h2 className="text-3xl md:text-2xl text-white font-bold">
                    กราฟค่า PH
                  </h2>
                  <p className="text-xl text-gray-300">วันที่: {displayDate}</p>
                </div>
                <Chart
                  options={createChartOptions(phSeries, "")}
                  series={phSeries}
                  type="line"
                  height={350}
                />
              </div>

              {/* SEC Chart */}
              <div className="space-y-5">
                <div className="flex flex-col md:flex-row md:space-x-5 items-baseline">
                  <h2 className="text-3xl md:text-2xl text-white font-bold">
                    กราฟค่าความเค็ม
                  </h2>
                  <p className="text-xl text-gray-300">วันที่: {displayDate}</p>
                </div>
                <Chart
                  options={createChartOptions(secSeries, "")}
                  series={secSeries}
                  type="line"
                  height={350}
                />
              </div>

              {/* Others Chart */}
              <div className="space-y-5">
                <div className="flex flex-col md:flex-row md:space-x-5 items-baseline">
                  <h2 className="text-3xl md:text-2xl text-white font-bold">
                    กราฟค่าอื่นๆ
                  </h2>
                  <p className="text-xl text-gray-300">วันที่: {displayDate}</p>
                </div>
                <Chart
                  options={createChartOptions(othersSeries, "")}
                  series={othersSeries}
                  type="line"
                  height={350}
                />
              </div>
            </div>
          )}

          {/* No Data State */}
          {!loading && !error && chartData.length === 0 && selectedUser && (
            <div className="text-white text-xl">
              ไม่พบข้อมูลสำหรับผู้ใช้งานนี้
            </div>
          )}

          {/* Initial State */}
          {!loading && !selectedUser && (
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
