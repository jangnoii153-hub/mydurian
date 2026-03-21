"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import NavbarUser17 from "@/components/NavbarUser17";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ChartDataRow {
  TimeStamp: string;
  [key: string]: any;
}

type FilterMode = "day" | "week" | "month";

interface ChartSet {
  title: string;
  allData: ChartDataRow[];
  filteredData: ChartDataRow[];
}

function ChartContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartSets, setChartSets] = useState<ChartSet[]>([]);
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

  async function fetchSheetData(url: string): Promise<ChartDataRow[] | null> {
    try {
      const finalURL = url + (url.includes("?") ? "&" : "?") + "t=" + Date.now();
      const response = await fetch(finalURL);
      const result = await response.json();

      let dataArray: ChartDataRow[] = [];

      if (result?.error) {
        console.error("Sheet API error:", result);
        return null;
      }

      if (result?.success && Array.isArray(result.data)) {
        dataArray = result.data;
      } else if (Array.isArray(result?.data)) {
        dataArray = result.data;
      } else if (Array.isArray(result)) {
        dataArray = result;
      }

      if (!dataArray.length) return null;

      return dataArray;
    } catch (err) {
      console.error("fetchSheetData error:", err);
      return null;
    }
  }

  async function loadChartData() {
    try {
      setLoading(true);
      setError(null);

      const docRef = doc(db, "users", uid!);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("ไม่พบข้อมูลผู้ใช้");
      }

      const userData = docSnap.data();

      const googleSheetURL = userData.googleSheet;
      const googleSheetURL2 = userData.googlesheet2;
      const googleSheetURL3 = userData.googlesheet3;

      const sets: ChartSet[] = [];

      if (googleSheetURL) {
        const data1 = await fetchSheetData(googleSheetURL);
        if (data1?.length) {
          sets.push({
            title: "Chart ชุดที่ 1",
            allData: data1,
            filteredData: [],
          });
        }
      }

      if (googleSheetURL2) {
        const data2 = await fetchSheetData(googleSheetURL2);
        if (data2?.length) {
          sets.push({
            title: "Chart ชุดที่ 2",
            allData: data2,
            filteredData: [],
          });
        }
      }

      if (googleSheetURL3) {
        const data3 = await fetchSheetData(googleSheetURL3);
        if (data3?.length) {
          sets.push({
            title: "Chart ชุดที่ 3",
            allData: data3,
            filteredData: [],
          });
        }
      }

      if (!sets.length) {
        throw new Error("ไม่มีข้อมูลกราฟ");
      }

      const today = new Date();
      const initializedSets = sets.map((setItem) => ({
        ...setItem,
        filteredData: filterRowsByDay(setItem.allData, today),
      }));

      setChartSets(initializedSets);
      setCurrentDate(today);
      setFilterMode("day");
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
      const [datePart, timePart] = ts.split(" ");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute, second] = timePart.split(":").map(Number);

      return new Date(year, month - 1, day, hour, minute, second);
    } catch {
      console.warn("Parse timestamp failed:", ts);
      return new Date();
    }
  }

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  function getWeekEnd(date: Date): Date {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  }

  function getMonthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  }

  function getMonthEnd(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  function filterRowsByDay(data: ChartDataRow[], targetDate: Date) {
    return data.filter((row) => {
      const rowDate = parseTimestamp(row.TimeStamp);
      return rowDate.toDateString() === targetDate.toDateString();
    });
  }

  function filterRowsByWeek(data: ChartDataRow[], targetDate: Date) {
    const weekStart = getWeekStart(targetDate);
    const weekEnd = getWeekEnd(targetDate);

    return data.filter((row) => {
      const rowDate = parseTimestamp(row.TimeStamp);
      return rowDate >= weekStart && rowDate <= weekEnd;
    });
  }

  function filterRowsByMonth(data: ChartDataRow[], targetDate: Date) {
    const monthStart = getMonthStart(targetDate);
    const monthEnd = getMonthEnd(targetDate);

    return data.filter((row) => {
      const rowDate = parseTimestamp(row.TimeStamp);
      return rowDate >= monthStart && rowDate <= monthEnd;
    });
  }

  function applyFilter(mode: FilterMode, targetDate: Date) {
    const updatedSets = chartSets.map((setItem) => {
      let filtered: ChartDataRow[] = [];

      if (mode === "day") {
        filtered = filterRowsByDay(setItem.allData, targetDate);
      } else if (mode === "week") {
        filtered = filterRowsByWeek(setItem.allData, targetDate);
      } else {
        filtered = filterRowsByMonth(setItem.allData, targetDate);
      }

      return {
        ...setItem,
        filteredData: filtered,
      };
    });

    setChartSets(updatedSets);
    setCurrentDate(targetDate);
    setFilterMode(mode);
  }

  function handlePrevDay() {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    applyFilter("day", newDate);
  }

  function handleNextDay() {
    const today = new Date();
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);

    if (newDate > today) return;

    applyFilter("day", newDate);
  }

  function handleCurrentDay() {
    applyFilter("day", new Date());
  }

  function handlePrevWeek() {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    applyFilter("week", newDate);
  }

  function handleCurrentWeek() {
    applyFilter("week", new Date());
  }

  function handlePrevMonth() {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    applyFilter("month", newDate);
  }

  function handleCurrentMonth() {
    applyFilter("month", new Date());
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
      series,
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

  function ChartSection({
    title,
    filteredData,
    displayDate,
  }: {
    title: string;
    filteredData: ChartDataRow[];
    displayDate: string;
  }) {
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
      <div className="w-full space-y-16">
        <div className="flex flex-wrap gap-3 items-baseline">
          <h1 className="text-4xl text-white font-bold">{title}</h1>
          <p className="text-xl text-gray-300">{displayDate}</p>
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-3 items-baseline">
            <h2 className="text-3xl text-white font-bold">กราฟอุณหภูมิ</h2>
            <p className="text-xl text-gray-300">{displayDate}</p>
          </div>
          <Chart
            options={createLineChartOptions(tempSeries)}
            series={tempSeries}
            type="line"
            height={350}
          />
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-3 items-baseline">
            <h2 className="text-3xl text-white font-bold">กราฟความชื้น</h2>
            <p className="text-xl text-gray-300">{displayDate}</p>
          </div>
          <Chart
            options={createLineChartOptions(humiSeries)}
            series={humiSeries}
            type="line"
            height={350}
          />
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-3 items-baseline">
            <h2 className="text-3xl text-white font-bold">กราฟค่าสารในดิน</h2>
            <p className="text-xl text-gray-300">{displayDate}</p>
          </div>
          <Chart
            options={createLineChartOptions(mattersSeries)}
            series={mattersSeries}
            type="line"
            height={350}
          />
        </div>

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

        <div className="space-y-5">
          <div className="flex flex-wrap gap-3 items-baseline">
            <h2 className="text-3xl text-white font-bold">กราฟค่าความเค็ม</h2>
            <p className="text-xl text-gray-300">{displayDate}</p>
          </div>
          <Chart
            options={createLineChartOptions(secSeries)}
            series={secSeries}
            type="line"
            height={350}
          />
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-3 items-baseline">
            <h2 className="text-3xl text-white font-bold">กราฟค่าอื่นๆ</h2>
            <p className="text-xl text-gray-300">{displayDate}</p>
          </div>
          <Chart
            options={createLineChartOptions(othersSeries)}
            series={othersSeries}
            type="line"
            height={350}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <>
        <NavbarUser17 />
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
        <NavbarUser17 />
        <main className="pt-20 pb-10 min-h-screen flex items-center justify-center">
          <p className="text-red-500 text-xl">{error}</p>
        </main>
        <Footer />
      </>
    );
  }

  const displayDate = getDisplayDate();
  const noDataEverywhere = chartSets.every((setItem) => setItem.filteredData.length === 0);

  return (
    <>
      <NavbarUser17 />
      <main className="pt-20 pb-10">
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

        <div className="px-4 md:px-28 space-y-24 pt-10">
          {noDataEverywhere ? (
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
            chartSets.map((setItem, index) => (
              <div key={index}>
                {setItem.filteredData.length > 0 ? (
                  <ChartSection
                    title={setItem.title}
                    filteredData={setItem.filteredData}
                    displayDate={displayDate}
                  />
                ) : (
                  <div className="space-y-4">
                    <h1 className="text-4xl text-white font-bold">{setItem.title}</h1>
                    <p className="text-gray-300 text-lg">
                      ไม่มีข้อมูลสำหรับช่วงเวลาที่เลือก
                    </p>
                  </div>
                )}
              </div>
            ))
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