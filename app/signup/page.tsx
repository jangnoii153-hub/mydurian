"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const durianOptions = [
  "ก้านยาวทรงหวด",
  "ก้านยาวสีนาก",
  "ชมพูพาน",
  "หมอนทอง",
  "กำปั่นดำ",
  "กำปั่นพวง",
  "กำปั่นเหลือง(เจ้ากรม)",
  "กำปั่นเดิม(ขาว)",
  "กำปั่นตาแพ",
  "ชายมะไฟ",
  "ดาวกระจาย",
  "ทองย้อยเดิม",
  "ทองย้อยฉัตร",
  "ฉัตรสีทอง",
  "ฉัตรสีนาก",
  "นกหยิบ",
  "อีหนัก",
  "ทับทิม",
  "กบก้านสั้น",
  "กบชายน้ำ",
  "กบสุวรรณ",
  "กบจำปา",
  "กบตาขำ",
  "กบตาเต่า",
  "กบตานวล",
  "กบไว",
  "กบพิกุล",
  "กบทองคำ",
  "กบตามาก",
  "กบแม่เฒ่า",
  "กบเล็บเหยี่ยว",
  "กบวัดกล้วย",
  "กบสาวน้อย",
  "กบเจ้าคุณ",
  "กบหน้าศาล",
  "กบหลังวิหาร",
  "กบหัวสิงห์",
  "กบเหมราช",
  "กบเหลือง",
  "กระดุมทอง",
  "กระดุมสีนาก",
  "กระปุกทองดี",
  "กลีบสมุทร",
  "กะเทยเนื้อขาว",
  "กะเทยเนื้อเหลือง",
  "การะเกด",
  "เจ้าเงาะ",
  "ชายมังคุด",
  "ตะพาบน้ำ",
  "ธรณีไหว",
  "บางขุนนนท์",
  "เขียวตำลึง",
  "เม็ดในยายปราง",
  "เม็ดในก้านยาว",
  "สาวชม",
  "สาวชมฟักทอง",
  "จอกลอย",
  "บาตรทองคำ",
  "ชะนี",
  "อีลวง",
  "อีลีบ",
  "ย่ำมะหวาด",
  "แดงรัศมี",
  "ชมพูศรี",
  "นวลทองจันทร์",
  "พวงมณี",
  "ฟักข้าว",
  "มูซานคิง",
  "ละอองฟ้า",
  "ซ่อนกลิ่น",
  "ทองกมล",
  "ทองแดง",
  "ทองลินจง",
  "ทองลิ้นจี่",
  "ลำเจียก",
  "ก้านยาววัดสัก",
  "จันทบุรี1",
  "จันทบุรี2",
  "จันทบุรี3",
  "จันทบุรี5",
  "หลงลับแล",
  "หลินลับแล",
];

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
    province: "",
    district: "",
    subdistrict: "",
    postcode: "",
    area: "",
    tree: "",
    iframe: "",
    typeDurian1: "",
    typeDurian2: "",
    typeDurian3: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      alert("รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (formData.password.length < 6) {
      alert("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (!formData.typeDurian1) {
      alert("กรุณาเลือกพันธุ์ทุเรียนอย่างน้อย 1 ชนิด");
      return;
    }

    try {
      setLoading(true);

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Save user data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        placeNo: "",
        placeName: "",
        uid: user.uid,
        googleSheet: "",
        email: formData.email,
        firstName: formData.firstname,
        lastName: formData.lastname,
        province: formData.province,
        district: formData.district,
        subdistrict: formData.subdistrict,
        postcode: formData.postcode,
        area: formData.area,
        tree: formData.tree,
        map: formData.iframe,
        type_durian1: formData.typeDurian1,
        type_durian2: formData.typeDurian2 || "",
        type_durian3: formData.typeDurian3 || "",
        createdAt: new Date(),
      });

      alert("สมัครสมาชิกสำเร็จ!");
      router.push("/login");
    } catch (error: any) {
      console.error("Error signing up:", error);

      // Handle specific Firebase errors
      if (error.code === "auth/email-already-in-use") {
        alert("อีเมลนี้ถูกใช้งานแล้ว");
      } else if (error.code === "auth/invalid-email") {
        alert("รูปแบบอีเมลไม่ถูกต้อง");
      } else if (error.code === "auth/weak-password") {
        alert("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      } else {
        alert("เกิดข้อผิดพลาด: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black py-6 flex flex-col justify-center sm:py-12 pt-20">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="relative px-4 py-10 bg-white/10 backdrop-blur-md shadow-xl rounded-3xl sm:p-16">
            <div className="max-w-md mx-auto">
              {/* Header */}
              <div className="flex flex-col items-center space-y-4 mb-8">
                <div className="text-center">
                  <h2 className="text-4xl font-bold text-white mb-2">
                    MyDurian
                  </h2>
                  <h3 className="text-xl text-gray-200">สมัครสมาชิก</h3>
                </div>
              </div>

              {/* Sign Up Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* First Name & Last Name */}
                <div className="flex space-x-4">
                  <div className="flex-1 space-y-2">
                    <label
                      htmlFor="firstname"
                      className="block text-sm font-medium text-gray-200"
                    >
                      ชื่อ <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstname"
                      name="firstname"
                      value={formData.firstname}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-300/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                      placeholder="กรอกชื่อ"
                      required
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <label
                      htmlFor="lastname"
                      className="block text-sm font-medium text-gray-200"
                    >
                      นามสกุล <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastname"
                      name="lastname"
                      value={formData.lastname}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-300/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                      placeholder="กรอกนามสกุล"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-200"
                  >
                    อีเมล <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-300/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                    placeholder="กรอกอีเมล"
                    required
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-200"
                  >
                    รหัสผ่าน <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-300/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                    placeholder="กรอกรหัสผ่าน"
                    required
                  />
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-200"
                  >
                    ยืนยันรหัสผ่าน <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-300/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    required
                  />
                </div>

                {/* Province & District */}
                <div className="flex space-x-4">
                  <div className="flex-1 space-y-2">
                    <label
                      htmlFor="province"
                      className="block text-sm font-medium text-gray-200"
                    >
                      จังหวัด <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="province"
                      name="province"
                      value={formData.province}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-300/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                      placeholder="กรอกจังหวัด"
                      required
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <label
                      htmlFor="district"
                      className="block text-sm font-medium text-gray-200"
                    >
                      อำเภอ <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="district"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-300/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                      placeholder="กรอกอำเภอ"
                      required
                    />
                  </div>
                </div>

                {/* Subdistrict & Postcode */}
                <div className="flex space-x-4">
                  <div className="flex-1 space-y-2">
                    <label
                      htmlFor="subdistrict"
                      className="block text-sm font-medium text-gray-200"
                    >
                      ตำบล <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="subdistrict"
                      name="subdistrict"
                      value={formData.subdistrict}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-300/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                      placeholder="กรอกตำบล"
                      required
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <label
                      htmlFor="postcode"
                      className="block text-sm font-medium text-gray-200"
                    >
                      รหัสไปรษณีย์ <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="postcode"
                      name="postcode"
                      value={formData.postcode}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-300/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                      placeholder="กรอกรหัสไปรษณีย์"
                      required
                    />
                  </div>
                </div>

                {/* Area & Tree */}
                <div className="flex space-x-4">
                  <div className="flex-1 space-y-2">
                    <label
                      htmlFor="area"
                      className="block text-sm font-medium text-gray-200"
                    >
                      พื้นที่ (ไร่)
                    </label>
                    <input
                      type="text"
                      id="area"
                      name="area"
                      value={formData.area}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-300/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                      placeholder="จำนวนพื้นที่"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <label
                      htmlFor="tree"
                      className="block text-sm font-medium text-gray-200"
                    >
                      จำนวนต้น (ต้น)
                    </label>
                    <input
                      type="text"
                      id="tree"
                      name="tree"
                      value={formData.tree}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-300/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                      placeholder="จำนวนต้นทุเรียน"
                    />
                  </div>
                </div>

                {/* Google Map Iframe */}
                <div className="space-y-2">
                  <label
                    htmlFor="iframe"
                    className="block text-sm font-medium text-gray-200"
                  >
                    Iframe Google Map
                  </label>
                  <input
                    type="text"
                    id="iframe"
                    name="iframe"
                    value={formData.iframe}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-300/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                    placeholder="กรอก Iframe"
                  />
                </div>

                {/* Durian Types */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="typeDurian1"
                      className="block text-sm font-medium text-gray-200"
                    >
                      พันธุ์ทุเรียน 1 <span className="text-red-600">*</span>
                    </label>
                    <select
                      id="typeDurian1"
                      name="typeDurian1"
                      value={formData.typeDurian1}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/10 text-white border border-gray-300/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="" disabled>
                        เลือกพันธุ์ทุเรียน
                      </option>
                      {durianOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="typeDurian2"
                      className="block text-sm font-medium text-gray-200"
                    >
                      พันธุ์ทุเรียน 2
                    </label>
                    <select
                      id="typeDurian2"
                      name="typeDurian2"
                      value={formData.typeDurian2}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/10 text-white border border-gray-300/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">เลือกพันธุ์ทุเรียน (ถ้ามี)</option>
                      {durianOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="typeDurian3"
                      className="block text-sm font-medium text-gray-200"
                    >
                      พันธุ์ทุเรียน 3
                    </label>
                    <select
                      id="typeDurian3"
                      name="typeDurian3"
                      value={formData.typeDurian3}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/10 text-white border border-gray-300/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">เลือกพันธุ์ทุเรียน (ถ้ามี)</option>
                      {durianOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-purple-200 transition duration-200"
                >
                  {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
                </button>

                {/* Login Link */}
                <div className="text-center mt-4">
                  <p className="text-gray-300">
                    มีบัญชีอยู่แล้ว?{" "}
                    <a
                      href="/login"
                      className="text-purple-400 hover:text-purple-300 font-medium"
                    >
                      เข้าสู่ระบบ
                    </a>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
