"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import NavbarUser from "@/components/NavbarUser";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ChartData {
  [key: string]: number | string;
}

interface AIResult {
  TimeStamp: string;
  resultEC: string;
  resultN: string;
  resultP: string;
  resultK: string;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestData, setLatestData] = useState<ChartData | null>(null);
  const [aiResult, setAIResult] = useState<AIResult | null>(null);

  useEffect(() => {
    if (!uid) {
      setError("ไม่พบ UID");
      setLoading(false);
      return;
    }
    loadDashboardData();
  }, [uid]);

  async function loadDashboardData() {
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
      const googleSheetURL_AI = userData.googleSheetURL_AI;

      if (!googleSheetURL) {
        throw new Error("ไม่พบ Google Sheet URL");
      }

      // Load sensor data
      const response = await fetch(googleSheetURL);
      const result = await response.json();

      let dataArray: ChartData[];
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

      const latest = dataArray[dataArray.length - 1];
      setLatestData(latest);

      // Load AI results if URL exists
      if (googleSheetURL_AI) {
        try {
          const aiResponse = await fetch(googleSheetURL_AI);
          const aiData = await aiResponse.json();

          let aiArray: AIResult[];
          if (aiData.success && Array.isArray(aiData.data)) {
            aiArray = aiData.data;
          } else if (Array.isArray(aiData)) {
            aiArray = aiData;
          } else {
            aiArray = [];
          }

          if (aiArray && aiArray.length > 0) {
            const latestAI = aiArray[aiArray.length - 1];
            setAIResult(latestAI);
          }
        } catch (aiError) {
          console.warn("Could not load AI results:", aiError);
        }
      }

      setLoading(false);
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "เกิดข้อผิดพลาด");
      setLoading(false);
    }
  }

  function createRadialChartOptions(
    label: string,
    value: number,
    color: string,
    customText?: string
  ) {
    return {
      chart: {
        type: "radialBar" as const,
        height: 200,
        foreColor: "#ccc",
        background: "transparent",
      },
      series: [value || 0],
      plotOptions: {
        radialBar: {
          hollow: { size: "65%" },
          dataLabels: {
            value: {
              show: true,
              fontSize: "22px",
              color: "#fff",
              formatter: () =>
                customText ? customText : (value || 0).toString(),
            },
            name: {
              show: true,
              color: "#aaa",
            },
          },
        },
      },
      labels: [label],
      colors: [color],
    };
  }

  function getAdvice(type: string, value: string): string {
    if (type === "EC") {
      if (value === "มาก") return "ใส่ปุ๋ยอินทรีย์ / ปุ๋ยคอก / ปุ๋ยหมัก";
      if (value === "ปกติ") return "ความเค็มปกติ";
      if (value === "น้อย") return "ควรใส่ปุ๋ยเพิ่ม";
    } else if (type === "N") {
      if (value === "น้อย") return "ควรใส่ปุ๋ยเพิ่ม";
      if (value === "ปกติ") return "ไนโตรเจนปกติ";
      if (value === "มาก") return "ควรใส่ฟางข้าวแห้ง, แกลบแห้ง, ซังข้าวโพดบด";
    } else if (type === "P") {
      if (value === "น้อย") return "ควรใส่ปุ๋ยเพิ่ม";
      if (value === "ปกติ") return "ฟอสฟอรัสปกติ";
      if (value === "มาก") return "ควรใส่ปูนโดโลไมท์";
    } else if (type === "K") {
      if (value === "น้อย") return "ควรใส่ปุ๋ยเพิ่ม";
      if (value === "ปกติ") return "โพแทสเซียมปกติ";
      if (value === "มาก") return "ควรใส่ถ่านชีวภาพหรือถ่านไบโอชาร์";
    }
    return "";
  }

  function getStatusColor(value: string): string {
    if (value === "มาก") return "text-red-400";
    if (value === "ปกติ") return "text-green-400";
    if (value === "น้อย") return "text-yellow-400";
    return "text-gray-400";
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

  const foatValue = ((latestData?.["ลูกลอย"] as number) || 0) * 100;
  const foatText = foatValue > 0 ? "ON" : "OFF";

  return (
    <>
      <NavbarUser />
      <main className="pt-20 pb-10">
        <div className="flex flex-col justify-center items-center space-y-8 px-6 md:px-28">
          {/* Temperature & Humidity */}
          <div className="w-full flex flex-col md:flex-row justify-between md:space-x-20 space-y-4 md:space-y-0 mt-10">
            {/* Temperature */}
            <div className="flex flex-col w-full md:w-1/2 bg-slate-500 bg-opacity-20 rounded-lg p-6">
              <p className="text-3xl text-white font-bold mb-4">อุณหภูมิ</p>
              <div className="flex justify-between items-center w-full">
                <div className="w-1/2">
                  <Chart
                    options={createRadialChartOptions(
                      "Temp",
                      (latestData?.["อุณหภูมิ_c"] as number) || 0,
                      "#facc15"
                    )}
                    series={[(latestData?.["อุณหภูมิ_c"] as number) || 0]}
                    type="radialBar"
                    height={200}
                  />
                </div>
                <div className="w-1/2">
                  <Chart
                    options={createRadialChartOptions(
                      "SoilTemp",
                      (latestData?.["อุณหภูมิดิน_c"] as number) || 0,
                      "#facc15"
                    )}
                    series={[(latestData?.["อุณหภูมิดิน_c"] as number) || 0]}
                    type="radialBar"
                    height={200}
                  />
                </div>
              </div>
            </div>

            {/* Humidity */}
            <div className="flex flex-col w-full md:w-1/2 bg-slate-500 bg-opacity-20 rounded-lg p-6">
              <p className="text-3xl text-white font-bold mb-4">ความชื้น</p>
              <div className="flex justify-between items-center w-full">
                <div className="w-1/2">
                  <Chart
                    options={createRadialChartOptions(
                      "Humidity",
                      (latestData?.["ความชื้น_เปอร์เซ็นต์"] as number) || 0,
                      "#3b82f6"
                    )}
                    series={[
                      (latestData?.["ความชื้น_เปอร์เซ็นต์"] as number) || 0,
                    ]}
                    type="radialBar"
                    height={200}
                  />
                </div>
                <div className="w-1/2">
                  <Chart
                    options={createRadialChartOptions(
                      "SoilHumidity",
                      (latestData?.["ความชื้นดิน_เปอร์เซ็นต์"] as number) || 0,
                      "#3b82f6"
                    )}
                    series={[
                      (latestData?.["ความชื้นดิน_เปอร์เซ็นต์"] as number) || 0,
                    ]}
                    type="radialBar"
                    height={200}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Soil Values */}
          <div className="flex flex-col w-10/12 bg-slate-500 bg-opacity-20 rounded-lg p-6 mx-auto">
            <p className="text-3xl text-white font-bold mb-4">ค่าในดิน</p>
            <div className="flex flex-wrap justify-center items-center gap-4">
              <div className="w-40 h-40">
                <Chart
                  options={createRadialChartOptions(
                    "pH",
                    (latestData?.["PH"] as number) || 0,
                    "#22c55e"
                  )}
                  series={[(latestData?.["PH"] as number) || 0]}
                  type="radialBar"
                  height={160}
                />
              </div>
              <div className="w-40 h-40">
                <Chart
                  options={createRadialChartOptions(
                    "EC",
                    (latestData?.["ความเค็ม_เปอร์เซ็นต์"] as number) || 0,
                    "#06b6d4"
                  )}
                  series={[
                    (latestData?.["ความเค็ม_เปอร์เซ็นต์"] as number) || 0,
                  ]}
                  type="radialBar"
                  height={160}
                />
              </div>
              <div className="w-40 h-40">
                <Chart
                  options={createRadialChartOptions(
                    "Nitrogen",
                    (latestData?.["ไนโตรเจน_เปอร์เซ็นต์"] as number) || 0,
                    "#84cc16"
                  )}
                  series={[
                    (latestData?.["ไนโตรเจน_เปอร์เซ็นต์"] as number) || 0,
                  ]}
                  type="radialBar"
                  height={160}
                />
              </div>
              <div className="w-40 h-40">
                <Chart
                  options={createRadialChartOptions(
                    "Phosphorus",
                    (latestData?.["ฟอสฟอรัส_เปอร์เซ็นต์"] as number) || 0,
                    "#eab308"
                  )}
                  series={[
                    (latestData?.["ฟอสฟอรัส_เปอร์เซ็นต์"] as number) || 0,
                  ]}
                  type="radialBar"
                  height={160}
                />
              </div>
              <div className="w-40 h-40">
                <Chart
                  options={createRadialChartOptions(
                    "Potassium",
                    (latestData?.["โพแทสเซียม_เปอร์เซ็นต์"] as number) || 0,
                    "#f97316"
                  )}
                  series={[
                    (latestData?.["โพแทสเซียม_เปอร์เซ็นต์"] as number) || 0,
                  ]}
                  type="radialBar"
                  height={160}
                />
              </div>
            </div>
          </div>

          {/* Other Values */}
          <div className="flex flex-col w-10/12 bg-slate-500 bg-opacity-20 rounded-lg p-6 mx-auto">
            <p className="text-3xl text-white font-bold mb-4">ค่าอื่นๆ</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 justify-items-center w-full">
              <div className="w-40 h-40">
                <Chart
                  options={createRadialChartOptions(
                    "Foat",
                    foatValue,
                    "#6366f1",
                    foatText
                  )}
                  series={[foatValue]}
                  type="radialBar"
                  height={160}
                />
              </div>
              <div className="w-40 h-40">
                <Chart
                  options={createRadialChartOptions(
                    "Pressure",
                    (latestData?.["แรงดัน_hPa"] as number) || 0,
                    "#6366f1"
                  )}
                  series={[(latestData?.["แรงดัน_hPa"] as number) || 0]}
                  type="radialBar"
                  height={160}
                />
              </div>
              <div className="w-40 h-40">
                <Chart
                  options={createRadialChartOptions(
                    "Light",
                    (latestData?.["ความเข้มแสง_lux"] as number) || 0,
                    "#f59e0b"
                  )}
                  series={[(latestData?.["ความเข้มแสง_lux"] as number) || 0]}
                  type="radialBar"
                  height={160}
                />
              </div>
              <div className="w-40 h-40">
                <Chart
                  options={createRadialChartOptions(
                    "Wind",
                    (latestData?.["ความเร็วลม_กิโลเมตรต่อชั่วโมง"] as number) ||
                      0,
                    "#ef4444"
                  )}
                  series={[
                    (latestData?.["ความเร็วลม_กิโลเมตรต่อชั่วโมง"] as number) ||
                      0,
                  ]}
                  type="radialBar"
                  height={160}
                />
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          {aiResult && (
            <div className="flex flex-col w-10/12 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg p-6 mx-auto border border-purple-500/30">
              <div className="flex items-center space-x-3 mb-6">
                <svg
                  className="w-8 h-8 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                <p className="text-3xl text-white font-bold">คำแนะนำจาก AI</p>
              </div>

              <div className="space-y-4">
                {/* EC */}
                <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-white">
                      ความเค็ม (EC)
                    </h3>
                    <span
                      className={`text-lg font-bold ${getStatusColor(
                        aiResult.resultEC
                      )}`}
                    >
                      {aiResult.resultEC}
                    </span>
                  </div>
                  <p className="text-red-400 text-sm">
                    {getAdvice("EC", aiResult.resultEC)}
                  </p>
                </div>

                {/* Nitrogen */}
                <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-white">
                      ไนโตรเจน (N)
                    </h3>
                    <span
                      className={`text-lg font-bold ${getStatusColor(
                        aiResult.resultN
                      )}`}
                    >
                      {aiResult.resultN}
                    </span>
                  </div>
                  <p className="text-red-400 text-sm">
                    {getAdvice("N", aiResult.resultN)}
                  </p>
                </div>

                {/* Phosphorus */}
                <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-white">
                      ฟอสฟอรัส (P)
                    </h3>
                    <span
                      className={`text-lg font-bold ${getStatusColor(
                        aiResult.resultP
                      )}`}
                    >
                      {aiResult.resultP}
                    </span>
                  </div>
                  <p className="text-red-400 text-sm">
                    {getAdvice("P", aiResult.resultP)}
                  </p>
                </div>

                {/* Potassium */}
                <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-white">
                      โพแทสเซียม (K)
                    </h3>
                    <span
                      className={`text-lg font-bold ${getStatusColor(
                        aiResult.resultK
                      )}`}
                    >
                      {aiResult.resultK}
                    </span>
                  </div>
                  <p className="text-red-400 text-sm">
                    {getAdvice("K", aiResult.resultK)}
                  </p>
                </div>

                {/* Timestamp */}
                <div className="text-center text-gray-400 text-sm mt-4">
                  อัปเดตล่าสุด: {aiResult.TimeStamp}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-white text-xl">กำลังโหลด...</div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
