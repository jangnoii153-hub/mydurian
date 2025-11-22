"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import NavbarUser from "@/components/NavbarUser";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ChartDataRow {
  TimeStamp: string;
  [key: string]: any;
}

type FilterMode = "day" | "week" | "month";

function ChartContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allData, setAllData] = useState<ChartDataRow[]>([]);
  const [filteredData, setFilteredData] = useState<ChartDataRow[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [filterMode, setFilterMode] = useState<FilterMode>("day");

  useEffect(() => {
    if (!uid) {
      setError("ไม่พบ UID");
      setLoading(false);
      return;
    }
    loadChartData();
  }, [uid]);

  async function loadChartData() {
    try {
      setLoading(true);
      setError(null);

      const docRef = doc(db, "users", uid!);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("ไม่พบข้อมูลผู้ใช้");
      }

      const googleSheetURL = docSnap.data().googleSheet;
      if (!googleSheetURL) {
        throw new Error("ไม่พบ Google Sheet URL");
      }

      const response = await fetch(googleSheetURL);
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

      setAllData(dataArray);

      // Set to today
      const today = new Date();
      setCurrentDate(today);
      filterDataByDay(dataArray, today);

      setLoading(false);
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "เกิดข้อผิดพลาด");
      setLoading(false);
    }
  }

  function parseTimestamp(ts: string): Date {
    if (!ts) return new Date();
    try {
      // Format: "2025-01-22 19:35:00"
      const [datePart, timePart] = ts.split(" ");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute, second] = timePart.split(":").map(Number);

      return new Date(year, month - 1, day, hour, minute, second);
    } catch (e) {
      console.warn("Parse timestamp failed:", ts);
      return new Date();
    }
  }

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    return new Date(d.setDate(diff));
  }

  function getWeekEnd(date: Date): Date {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Sunday
    return weekEnd;
  }

  function getMonthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function getMonthEnd(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  function filterDataByDay(data: ChartDataRow[], targetDate: Date) {
    const filtered = data.filter((row) => {
      const rowDate = parseTimestamp(row.TimeStamp);
      return rowDate.toDateString() === targetDate.toDateString();
    });
    setFilteredData(filtered);
    setFilterMode("day");
  }

  function filterDataByWeek(data: ChartDataRow[], targetDate: Date) {
    const weekStart = getWeekStart(targetDate);
    const weekEnd = getWeekEnd(targetDate);

    const filtered = data.filter((row) => {
      const rowDate = parseTimestamp(row.TimeStamp);
      return rowDate >= weekStart && rowDate <= weekEnd;
    });
    setFilteredData(filtered);
    setFilterMode("week");
  }

  function filterDataByMonth(data: ChartDataRow[], targetDate: Date) {
    const monthStart = getMonthStart(targetDate);
    const monthEnd = getMonthEnd(targetDate);

    const filtered = data.filter((row) => {
      const rowDate = parseTimestamp(row.TimeStamp);
      return rowDate >= monthStart && rowDate <= monthEnd;
    });
    setFilteredData(filtered);
    setFilterMode("month");
  }

  // Navigation handlers
  function handlePrevDay() {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
    filterDataByDay(allData, newDate);
  }

  function handleNextDay() {
    const today = new Date();
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);

    // ไม่ให้เลยวันปัจจุบัน
    if (newDate > today) {
      return;
    }

    setCurrentDate(newDate);
    filterDataByDay(allData, newDate);
  }

  function handleCurrentDay() {
    const today = new Date();
    setCurrentDate(today);
    filterDataByDay(allData, today);
  }

  function handlePrevWeek() {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
    filterDataByWeek(allData, newDate);
  }

  function handleCurrentWeek() {
    const today = new Date();
    setCurrentDate(today);
    filterDataByWeek(allData, today);
  }

  function handlePrevMonth() {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
    filterDataByMonth(allData, newDate);
  }

  function handleCurrentMonth() {
    const today = new Date();
    setCurrentDate(today);
    filterDataByMonth(allData, today);
  }

  function createLineChartOptions(series: any[]) {
    return {
      chart: {
        type: "line" as const,
        height: 350,
        background: "transparent",
        toolbar: { show: true },
      },
      stroke: { curve: "smooth" as const, width: 2 },
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
    };
  }

  function getDisplayDate(): string {
    if (filterMode === "day") {
      return currentDate.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else if (filterMode === "week") {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = getWeekEnd(currentDate);
      return `${weekStart.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
      })} - ${weekEnd.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`;
    } else {
      return currentDate.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
      });
    }
  }

  if (loading) {
    return (
      <>
        <NavbarUser />
        <main className="pt-20 pb-10 min-h-screen flex items-center justify-center">
          <p className="text-white text-xl">กำลังโหลดข้อมูล...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <NavbarUser />
        <main className="pt-20 pb-10 min-h-screen flex items-center justify-center">
          <p className="text-red-500 text-xl">{error}</p>
        </main>
        <Footer />
      </>
    );
  }

  const displayDate = getDisplayDate();

  // Prepare chart data
  const tempSeries = [
    {
      name: "อุณหภูมิ (°C)",
      data: filteredData.map((r) => [
        parseTimestamp(r.TimeStamp).getTime(),
        parseFloat(r.อุณหภูมิ_c) || 0,
      ]),
    },
    {
      name: "อุณหภูมิดิน (°C)",
      data: filteredData.map((r) => [
        parseTimestamp(r.TimeStamp).getTime(),
        parseFloat(r.อุณหภูมิดิน_c) || 0,
      ]),
    },
  ];

  const humiSeries = [
    {
      name: "ความชื้น (%)",
      data: filteredData.map((r) => [
        parseTimestamp(r.TimeStamp).getTime(),
        parseFloat(r.ความชื้น_เปอร์เซ็นต์) || 0,
      ]),
    },
    {
      name: "ความชื้นดิน (%)",
      data: filteredData.map((r) => [
        parseTimestamp(r.TimeStamp).getTime(),
        parseFloat(r.ความชื้นดิน_เปอร์เซ็นต์) || 0,
      ]),
    },
  ];

  const mattersSeries = [
    {
      name: "ไนโตรเจน (%)",
      data: filteredData.map((r) => [
        parseTimestamp(r.TimeStamp).getTime(),
        parseFloat(r.ไนโตรเจน_เปอร์เซ็นต์) || 0,
      ]),
    },
    {
      name: "ฟอสฟอรัส (%)",
      data: filteredData.map((r) => [
        parseTimestamp(r.TimeStamp).getTime(),
        parseFloat(r.ฟอสฟอรัส_เปอร์เซ็นต์) || 0,
      ]),
    },
    {
      name: "โพแทสเซียม (%)",
      data: filteredData.map((r) => [
        parseTimestamp(r.TimeStamp).getTime(),
        parseFloat(r.โพแทสเซียม_เปอร์เซ็นต์) || 0,
      ]),
    },
  ];

  const phSeries = [
    {
      name: "PH",
      data: filteredData.map((r) => [
        parseTimestamp(r.TimeStamp).getTime(),
        parseFloat(r.PH) || 0,
      ]),
    },
  ];

  const secSeries = [
    {
      name: "ความเค็ม (%)",
      data: filteredData.map((r) => [
        parseTimestamp(r.TimeStamp).getTime(),
        parseFloat(r.ความเค็ม_เปอร์เซ็นต์) || 0,
      ]),
    },
  ];

  const othersSeries = [
    {
      name: "ความเข้มแสง",
      data: filteredData.map((r) => [
        parseTimestamp(r.TimeStamp).getTime(),
        parseFloat(r.ความเข้มแสง_lux) || 0,
      ]),
    },
    {
      name: "แรงดัน",
      data: filteredData.map((r) => [
        parseTimestamp(r.TimeStamp).getTime(),
        parseFloat(r.แรงดัน_hPa) || 0,
      ]),
    },
    {
      name: "ความเร็วลม",
      data: filteredData.map((r) => [
        parseTimestamp(r.TimeStamp).getTime(),
        parseFloat(r.ความเร็วลม_กิโลเมตรต่อชั่วโมง) || 0,
      ]),
    },
  ];

  return (
    <>
      <NavbarUser />
      <main className="pt-20 pb-10">
        {/* Navigation Buttons */}
        <div className="flex flex-wrap justify-center items-center gap-3 px-4 pt-10">
          <button
            onClick={handlePrevDay}
            className="px-4 py-2 bg-lime-500 text-white rounded-lg hover:bg-lime-400 transition-all font-kanit"
          >
            วันก่อนหน้า
          </button>
          <button
            onClick={handlePrevWeek}
            className="px-4 py-2 bg-lime-500 text-white rounded-lg hover:bg-lime-400 transition-all font-kanit"
          >
            อาทิตย์ก่อนหน้า
          </button>
          <button
            onClick={handlePrevMonth}
            className="px-4 py-2 bg-lime-500 text-white rounded-lg hover:bg-lime-400 transition-all font-kanit"
          >
            เดือนก่อนหน้า
          </button>
          <button
            onClick={handleCurrentWeek}
            className="px-4 py-2 bg-lime-500 text-white rounded-lg hover:bg-lime-400 transition-all font-kanit"
          >
            อาทิตย์นี้
          </button>
          <button
            onClick={handleCurrentMonth}
            className="px-4 py-2 bg-lime-500 text-white rounded-lg hover:bg-lime-400 transition-all font-kanit"
          >
            เดือนปัจจุบัน
          </button>
          <button
            onClick={handleCurrentDay}
            className="px-4 py-2 bg-lime-500 text-white rounded-lg hover:bg-lime-400 transition-all font-kanit"
          >
            วันปัจจุบัน
          </button>
          <button
            onClick={handleNextDay}
            className="px-4 py-2 bg-lime-500 text-white rounded-lg hover:bg-lime-400 transition-all font-kanit disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentDate.toDateString() === new Date().toDateString()}
          >
            วันถัดไป
          </button>
        </div>

        {/* Charts */}
        <div className="px-4 md:px-28 space-y-16 pt-10">
          {filteredData.length === 0 ? (
            <div className="text-white text-center text-xl">
              ไม่มีข้อมูลสำหรับ
              {filterMode === "day"
                ? "วัน"
                : filterMode === "week"
                ? "อาทิตย์"
                : "เดือน"}
              ที่เลือก
            </div>
          ) : (
            <>
              {/* Temperature Chart */}
              <div className="space-y-5">
                <div className="flex flex-wrap gap-3 items-baseline">
                  <h2 className="text-3xl text-white font-bold">
                    กราฟอุณหภูมิ
                  </h2>
                  <p className="text-xl text-gray-300">{displayDate}</p>
                </div>
                <Chart
                  options={createLineChartOptions(tempSeries)}
                  series={tempSeries}
                  type="line"
                  height={350}
                />
              </div>

              {/* Humidity Chart */}
              <div className="space-y-5">
                <div className="flex flex-wrap gap-3 items-baseline">
                  <h2 className="text-3xl text-white font-bold">
                    กราฟความชื้น
                  </h2>
                  <p className="text-xl text-gray-300">{displayDate}</p>
                </div>
                <Chart
                  options={createLineChartOptions(humiSeries)}
                  series={humiSeries}
                  type="line"
                  height={350}
                />
              </div>

              {/* Matters Chart */}
              <div className="space-y-5">
                <div className="flex flex-wrap gap-3 items-baseline">
                  <h2 className="text-3xl text-white font-bold">
                    กราฟค่าสารในดิน
                  </h2>
                  <p className="text-xl text-gray-300">{displayDate}</p>
                </div>
                <Chart
                  options={createLineChartOptions(mattersSeries)}
                  series={mattersSeries}
                  type="line"
                  height={350}
                />
              </div>

              {/* PH Chart */}
              <div className="space-y-5">
                <div className="flex flex-wrap gap-3 items-baseline">
                  <h2 className="text-3xl text-white font-bold">กราฟค่า PH</h2>
                  <p className="text-xl text-gray-300">{displayDate}</p>
                </div>
                <Chart
                  options={createLineChartOptions(phSeries)}
                  series={phSeries}
                  type="line"
                  height={350}
                />
              </div>

              {/* SEC Chart */}
              <div className="space-y-5">
                <div className="flex flex-wrap gap-3 items-baseline">
                  <h2 className="text-3xl text-white font-bold">
                    กราฟค่าความเค็ม
                  </h2>
                  <p className="text-xl text-gray-300">{displayDate}</p>
                </div>
                <Chart
                  options={createLineChartOptions(secSeries)}
                  series={secSeries}
                  type="line"
                  height={350}
                />
              </div>

              {/* Others Chart */}
              <div className="space-y-5">
                <div className="flex flex-wrap gap-3 items-baseline">
                  <h2 className="text-3xl text-white font-bold">
                    กราฟค่าอื่นๆ
                  </h2>
                  <p className="text-xl text-gray-300">{displayDate}</p>
                </div>
                <Chart
                  options={createLineChartOptions(othersSeries)}
                  series={othersSeries}
                  type="line"
                  height={350}
                />
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function ChartPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-white text-xl">กำลังโหลด...</div>
        </div>
      }
    >
      <ChartContent />
    </Suspense>
  );
}
