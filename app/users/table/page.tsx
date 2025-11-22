"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import NavbarUser from "@/components/NavbarUser";
import Footer from "@/components/Footer";

interface TableDataRow {
  TimeStamp: string;
  อุณหภูมิ_c: string;
  อุณหภูมิดิน_c: string;
  ความชื้น_เปอร์เซ็นต์: string;
  ความชื้นดิน_เปอร์เซ็นต์: string;
  แรงดัน_hPa: string;
  ความเข้มแสง_lux: string;
  ลูกลอย: string;
  PH: string;
  ความเค็ม_เปอร์เซ็นต์: string;
  ไนโตรเจน_เปอร์เซ็นต์: string;
  ฟอสฟอรัส_เปอร์เซ็นต์: string;
  โพแทสเซียม_เปอร์เซ็นต์: string;
  ความเร็วลม_กิโลเมตรต่อชั่วโมง: string;
  [key: string]: any;
}

interface MonthOption {
  value: string;
  text: string;
  year: number;
  month: number;
}

function TableContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allData, setAllData] = useState<TableDataRow[]>([]);
  const [filteredData, setFilteredData] = useState<TableDataRow[]>([]);
  const [monthOptions, setMonthOptions] = useState<MonthOption[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  useEffect(() => {
    if (!uid) {
      setError("ไม่พบ UID");
      setLoading(false);
      return;
    }
    loadTableData();
  }, [uid]);

  async function loadTableData() {
    try {
      setLoading(true);
      setError(null);

      const docRef = doc(db, "users", uid!);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) throw new Error("ไม่พบข้อมูลผู้ใช้");

      const googleSheetURL = docSnap.data().googleSheet;
      if (!googleSheetURL) throw new Error("ไม่พบ Google Sheet URL");

      const response = await fetch(googleSheetURL);
      const result = await response.json();

      let dataArray: TableDataRow[];
      if (result.success && Array.isArray(result.data)) {
        dataArray = result.data;
      } else if (Array.isArray(result)) {
        dataArray = result;
      } else {
        throw new Error("รูปแบบข้อมูลไม่ถูกต้อง");
      }

      if (!dataArray.length) throw new Error("ไม่มีข้อมูล");

      setAllData(dataArray);
      generateMonthOptions(dataArray);
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
      const cleanTs = ts.replace(/'/g, "").trim();
      const [datePart, timePart] = cleanTs.split(" ");

      if (datePart) {
        const [year, month, day] = datePart.split("-").map(Number);

        if (timePart) {
          const [hour, minute, second] = timePart.split(":").map(Number);
          return new Date(year, month - 1, day, hour, minute, second || 0);
        }

        return new Date(year, month - 1, day);
      }

      return new Date();
    } catch (e) {
      console.error("Error parsing timestamp:", ts, e);
      return new Date();
    }
  }

  function formatDisplayDate(ts: string): string {
    const date = parseTimestamp(ts);
    if (isNaN(date.getTime())) return ts;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${hour}:${minute}`;
  }

  function generateMonthOptions(data: TableDataRow[]) {
    const availableMonths: string[] = [];

    data.forEach((row) => {
      const date = parseTimestamp(row.TimeStamp);
      if (!isNaN(date.getTime())) {
        const monthStr = String(date.getMonth() + 1).padStart(2, "0");
        const yearStr = date.getFullYear();
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

    const options = availableMonths
      .map((monthYear) => {
        const [month, year] = monthYear.split("-");
        return {
          value: monthYear,
          text: `${monthNames[parseInt(month) - 1]} ${year}`,
          year: parseInt(year),
          month: parseInt(month),
        };
      })
      .sort((a, b) =>
        a.year !== b.year ? b.year - a.year : b.month - a.month
      );

    setMonthOptions(options);

    if (options.length) {
      const latestMonth = options[0].value;
      setSelectedMonth(latestMonth);
      filterDataByMonth(latestMonth, data);
    }
  }

  function filterDataByMonth(monthValue: string, data: TableDataRow[]) {
    const [month, year] = monthValue.split("-");
    const filtered = data.filter((row) => {
      const date = parseTimestamp(row.TimeStamp);
      return (
        date.getMonth() + 1 === parseInt(month) &&
        date.getFullYear() === parseInt(year)
      );
    });

    filtered.sort((a, b) => {
      const dateA = parseTimestamp(a.TimeStamp);
      const dateB = parseTimestamp(b.TimeStamp);
      return dateB.getTime() - dateA.getTime();
    });

    setFilteredData(filtered);
  }

  function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setSelectedMonth(value);
    filterDataByMonth(value, allData);
  }

  function downloadCSV() {
    if (!filteredData.length) return;

    const csvRows: string[] = [];
    const headers = Object.keys(filteredData[0]).join(",");
    csvRows.push(headers);

    filteredData.forEach((row) => {
      const values = Object.values(row).map((val) => {
        const str = String(val);
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
    a.download = `data_${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

  return (
    <>
      <NavbarUser />
      <main className="pt-20 pb-10">
        <div className="px-4 md:px-28 space-y-8 pt-10">
          {/* Filter Controls */}
          <div className="w-full flex flex-col md:flex-row items-center gap-4">
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className="flex-1 px-4 py-2 rounded-lg bg-slate-200 text-gray-700 border-none"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.text}
                </option>
              ))}
            </select>

            <button
              onClick={downloadCSV}
              className="px-4 py-2 bg-lime-500 text-white rounded-lg hover:bg-lime-400 transition-all"
            >
              ดาวน์โหลดข้อมูล
            </button>
          </div>

          {/* Data Summary */}
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <p className="text-gray-600">
              แสดงข้อมูลทั้งหมด:{" "}
              <span className="font-bold text-gray-800">
                {filteredData.length}
              </span>{" "}
              รายการ
            </p>
          </div>

          {/* Table */}
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
                {filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={14}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      ไม่มีข้อมูลสำหรับเดือนที่เลือก
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, index) => (
                    <tr key={index} className="bg-white hover:bg-gray-100">
                      <td className="px-4 py-2 border">
                        {formatDisplayDate(row.TimeStamp)}
                      </td>
                      <td className="px-4 py-2 border text-center">
                        {row.อุณหภูมิ_c}
                      </td>
                      <td className="px-4 py-2 border text-center">
                        {row.อุณหภูมิดิน_c}
                      </td>
                      <td className="px-4 py-2 border text-center">
                        {row.ความชื้น_เปอร์เซ็นต์}
                      </td>
                      <td className="px-4 py-2 border text-center">
                        {row.ความชื้นดิน_เปอร์เซ็นต์}
                      </td>
                      <td className="px-4 py-2 border text-center">
                        {row.แรงดัน_hPa}
                      </td>
                      <td className="px-4 py-2 border text-center">
                        {row.ความเข้มแสง_lux}
                      </td>
                      <td className="px-4 py-2 border text-center">
                        {row.ลูกลอย}
                      </td>
                      <td className="px-4 py-2 border text-center">{row.PH}</td>
                      <td className="px-4 py-2 border text-center">
                        {row.ความเค็ม_เปอร์เซ็นต์}
                      </td>
                      <td className="px-4 py-2 border text-center">
                        {row.ไนโตรเจน_เปอร์เซ็นต์}
                      </td>
                      <td className="px-4 py-2 border text-center">
                        {row.ฟอสฟอรัส_เปอร์เซ็นต์}
                      </td>
                      <td className="px-4 py-2 border text-center">
                        {row.โพแทสเซียม_เปอร์เซ็นต์}
                      </td>
                      <td className="px-4 py-2 border text-center">
                        {row.ความเร็วลม_กิโลเมตรต่อชั่วโมง}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
