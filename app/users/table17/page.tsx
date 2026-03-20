"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import NavbarUser17 from "@/components/NavbarUser17";
import Footer from "@/components/Footer";

interface TableDataRow {
  TimeStamp: string;
  อุณหภูมิ_c?: string;
  อุณหภูมิดิน_c?: string;
  ความชื้น_เปอร์เซ็นต์?: string;
  ความชื้นดิน_เปอร์เซ็นต์?: string;
  แรงดัน_hPa?: string;
  ความเข้มแสง_lux?: string;
  ลูกลอย?: string;
  PH?: string;
  ความเค็ม_เปอร์เซ็นต์?: string;
  ไนโตรเจน_เปอร์เซ็นต์?: string;
  ฟอสฟอรัส_เปอร์เซ็นต์?: string;
  โพแทสเซียม_เปอร์เซ็นต์?: string;
  ความเร็วลม_กิโลเมตรต่อชั่วโมง?: string;
  [key: string]: any;
}

interface MonthOption {
  value: string;
  text: string;
  year: number;
  month: number;
}

interface TableSet {
  title: string;
  keyName: string;
  allData: TableDataRow[];
  filteredData: TableDataRow[];
  fetchFailed?: boolean;
}

function TableContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableSets, setTableSets] = useState<TableSet[]>([]);
  const [globalMonth, setGlobalMonth] = useState<string>("");
  const [globalMonthOptions, setGlobalMonthOptions] = useState<MonthOption[]>([]);

  useEffect(() => {
    if (!uid) {
      setError("ไม่พบ UID");
      setLoading(false);
      return;
    }
    loadTableData();
  }, [uid]);

  useEffect(() => {
    if (!globalMonth) return;

    setTableSets((prev) =>
      prev.map((setItem) => ({
        ...setItem,
        filteredData: filterDataByMonthValue(globalMonth, setItem.allData),
      }))
    );
  }, [globalMonth]);

  async function fetchSheetData(url: string): Promise<TableDataRow[] | null> {
    try {
      const finalURL = url + (url.includes("?") ? "&" : "?") + "t=" + Date.now();

      const response = await fetch(finalURL, {
        method: "GET",
        mode: "cors",
      });

      if (!response.ok) {
        console.warn("Fetch failed with status:", response.status, finalURL);
        return null;
      }

      const result = await response.json();

      if (result?.error) {
        console.warn("Sheet API error:", result);
        return null;
      }

      if (result?.success && Array.isArray(result.data)) {
        return result.data;
      }

      if (Array.isArray(result?.data)) {
        return result.data;
      }

      if (Array.isArray(result)) {
        return result;
      }

      return null;
    } catch (err) {
      console.warn("fetchSheetData skipped:", err);
      return null;
    }
  }

  async function loadTableData() {
    try {
      setLoading(true);
      setError(null);

      const docRef = doc(db, "users", uid!);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) throw new Error("ไม่พบข้อมูลผู้ใช้");

      const userData = docSnap.data();

      const googleSheetURL = userData.googleSheet;
      const googleSheetURL2 = userData.googlesheet2;
      const googleSheetURL3 = userData.googlesheet3;

      const sets: TableSet[] = [];
      let allMonths: MonthOption[] = [];

      const data1 = googleSheetURL ? await fetchSheetData(googleSheetURL) : null;
      const monthOptions1 = data1 ? generateMonthOptionsFromData(data1) : [];
      allMonths = [...allMonths, ...monthOptions1];
      sets.push({
        title: "Table ชุดที่ 1",
        keyName: "table1",
        allData: data1 || [],
        filteredData: [],
        fetchFailed: !!googleSheetURL && !data1,
      });

      const data2 = googleSheetURL2 ? await fetchSheetData(googleSheetURL2) : null;
      const monthOptions2 = data2 ? generateMonthOptionsFromData(data2) : [];
      allMonths = [...allMonths, ...monthOptions2];
      sets.push({
        title: "Table ชุดที่ 2",
        keyName: "table2",
        allData: data2 || [],
        filteredData: [],
        fetchFailed: !!googleSheetURL2 && !data2,
      });

      const data3 = googleSheetURL3 ? await fetchSheetData(googleSheetURL3) : null;
      const monthOptions3 = data3 ? generateMonthOptionsFromData(data3) : [];
      allMonths = [...allMonths, ...monthOptions3];
      sets.push({
        title: "Table ชุดที่ 3",
        keyName: "table3",
        allData: data3 || [],
        filteredData: [],
        fetchFailed: !!googleSheetURL3 && !data3,
      });

      const uniqueMonths = Array.from(
        new Map(allMonths.map((m) => [m.value, m])).values()
      ).sort((a, b) =>
        a.year !== b.year ? b.year - a.year : b.month - a.month
      );

      setGlobalMonthOptions(uniqueMonths);
      setTableSets(sets);

      if (uniqueMonths.length > 0) {
        setGlobalMonth(uniqueMonths[0].value);
      } else {
        setGlobalMonth("");
      }

      setLoading(false);
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "เกิดข้อผิดพลาด");
      setLoading(false);
    }
  }

  function parseTimestamp(ts: string): Date {
    if (!ts) return new Date(NaN);

    try {
      const raw = String(ts).trim();

      // รองรับ ISO เช่น 2026-03-16T08:52:23.000Z
      const isoDate = new Date(raw);
      if (!isNaN(isoDate.getTime())) {
        return isoDate;
      }

      // รองรับ format เดิม เช่น 2026-03-16 08:52:23
      const cleanTs = raw.replace(/'/g, "");
      const [datePart, timePart] = cleanTs.split(" ");

      if (!datePart) return new Date(NaN);

      const [year, month, day] = datePart.split("-").map(Number);

      if (timePart) {
        const [hour, minute, second] = timePart.split(":").map(Number);
        return new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
      }

      return new Date(year, month - 1, day);
    } catch (e) {
      console.error("Error parsing timestamp:", ts, e);
      return new Date(NaN);
    }
  }

  function formatDisplayDate(ts: string): string {
    const date = parseTimestamp(ts);
    if (isNaN(date.getTime())) return String(ts);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${hour}:${minute}`;
  }

  function generateMonthOptionsFromData(data: TableDataRow[]): MonthOption[] {
    const availableMonths: string[] = [];

    data.forEach((row) => {
      const date = parseTimestamp(row.TimeStamp);

      if (!isNaN(date.getTime())) {
        const monthStr = String(date.getMonth() + 1).padStart(2, "0");
        const yearStr = String(date.getFullYear());
        const monthYear = `${monthStr}-${yearStr}`;

        if (!availableMonths.includes(monthYear)) {
          availableMonths.push(monthYear);
        }
      }
    });

    const monthNames = [
      "ม.ค.",
      "ก.พ.",
      "มี.ค.",
      "เม.ย.",
      "พ.ค.",
      "มิ.ย.",
      "ก.ค.",
      "ส.ค.",
      "ก.ย.",
      "ต.ค.",
      "พ.ย.",
      "ธ.ค.",
    ];

    return availableMonths
      .map((monthYear) => {
        const [month, year] = monthYear.split("-");
        return {
          value: monthYear,
          text: `${monthNames[parseInt(month, 10) - 1]} ${year}`,
          year: parseInt(year, 10),
          month: parseInt(month, 10),
        };
      })
      .sort((a, b) =>
        a.year !== b.year ? b.year - a.year : b.month - a.month
      );
  }

  function filterDataByMonthValue(monthValue: string, data: TableDataRow[]) {
    if (!monthValue || !data.length) return [];

    const [month, year] = monthValue.split("-");

    const filtered = data.filter((row) => {
      const date = parseTimestamp(row.TimeStamp);
      if (isNaN(date.getTime())) return false;

      return (
        date.getMonth() + 1 === parseInt(month, 10) &&
        date.getFullYear() === parseInt(year, 10)
      );
    });

    filtered.sort((a, b) => {
      const dateA = parseTimestamp(a.TimeStamp);
      const dateB = parseTimestamp(b.TimeStamp);
      return dateB.getTime() - dateA.getTime();
    });

    return filtered;
  }

  function downloadCSV(setItem: TableSet) {
    if (!setItem.filteredData.length) return;

    const csvRows: string[] = [];
    const headers = Object.keys(setItem.filteredData[0]).join(",");
    csvRows.push(headers);

    setItem.filteredData.forEach((row) => {
      const values = Object.values(row).map((val) => {
        const str = String(val ?? "");
        return str.includes(",") ? `"${str}"` : str;
      });
      csvRows.push(values.join(","));
    });

    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${setItem.keyName}_${globalMonth || "data"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function TableSection({ setItem }: { setItem: TableSet }) {
    return (
      <div className="space-y-8">
        <h2 className="text-3xl text-white font-bold">{setItem.title}</h2>

        <div className="bg-white p-4 rounded-lg shadow-lg">
          <p className="text-gray-600">
            แสดงข้อมูลทั้งหมด:{" "}
            <span className="font-bold text-gray-800">
              {setItem.filteredData.length}
            </span>{" "}
            รายการ
          </p>
          {setItem.fetchFailed && (
            <p className="text-sm text-orange-500 mt-2">
              โหลดข้อมูลชุดนี้ไม่สำเร็จ ระบบข้ามชุดนี้ให้อัตโนมัติ
            </p>
          )}
        </div>

        <div className="bg-white p-2 md:p-4 rounded-lg shadow-lg overflow-x-auto">
          <table className="min-w-full border border-gray-800 border-collapse rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-200">
                {[
                  "วันที่/เวลา",
                  "อุณหภูมิ (°C)",
                  "อุณหภูมิดิน (°C)",
                  "ความชื้น (%)",
                  "ความชื้นดิน (%)",
                  "แรงดัน (hPa)",
                  "ความเข้มแสง (lux)",
                  "ลูกลอย",
                  "PH",
                  "ความเค็ม (%)",
                  "ไนโตรเจน (%)",
                  "ฟอสฟอรัส (%)",
                  "โพแทสเซียม (%)",
                  "ความเร็วลม (km/hr)",
                ].map((header, i) => (
                  <th
                    key={i}
                    className="px-4 py-2 border border-gray-300 text-left text-gray-600 whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {setItem.filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={14}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    ไม่มีข้อมูล
                  </td>
                </tr>
              ) : (
                setItem.filteredData.map((row, index) => (
                  <tr key={index} className="bg-white hover:bg-gray-100">
                    <td className="px-4 py-2 border">
                      {formatDisplayDate(row.TimeStamp)}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {row.อุณหภูมิ_c ?? "-"}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {row.อุณหภูมิดิน_c ?? "-"}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {row.ความชื้น_เปอร์เซ็นต์ ?? "-"}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {row.ความชื้นดิน_เปอร์เซ็นต์ ?? "-"}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {row.แรงดัน_hPa ?? "-"}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {row.ความเข้มแสง_lux ?? "-"}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {row.ลูกลอย ?? "-"}
                    </td>
                    <td className="px-4 py-2 border text-center">{row.PH ?? "-"}</td>
                    <td className="px-4 py-2 border text-center">
                      {row.ความเค็ม_เปอร์เซ็นต์ ?? "-"}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {row.ไนโตรเจน_เปอร์เซ็นต์ ?? "-"}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {row.ฟอสฟอรัส_เปอร์เซ็นต์ ?? "-"}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {row.โพแทสเซียม_เปอร์เซ็นต์ ?? "-"}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {row.ความเร็วลม_กิโลเมตรต่อชั่วโมง ?? "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => downloadCSV(setItem)}
            className="px-4 py-2 bg-lime-500 text-white rounded-lg hover:bg-lime-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={setItem.filteredData.length === 0}
          >
            ดาวน์โหลดข้อมูล {setItem.title}
          </button>
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

  return (
    <>
      <NavbarUser17 />
      <main className="pt-20 pb-10">
        <div className="px-4 md:px-28 space-y-12 pt-10">
          <div className="w-full flex flex-col md:flex-row items-center gap-4">
            <select
              value={globalMonth}
              onChange={(e) => setGlobalMonth(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg bg-slate-200 text-gray-700 border-none"
            >
              {globalMonthOptions.length > 0 ? (
                globalMonthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.text}
                  </option>
                ))
              ) : (
                <option value="">ไม่มีเดือนให้เลือก</option>
              )}
            </select>
          </div>

          {tableSets.map((setItem) => (
            <TableSection key={setItem.keyName} setItem={setItem} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function TablePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-white text-xl">กำลังโหลด...</div>
        </div>
      }
    >
      <TableContent />
    </Suspense>
  );
}