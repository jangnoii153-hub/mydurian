"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Link from "next/link";
import Footer from "@/components/Footer";

function AddAdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOtpForm, setShowOtpForm] = useState(false);

  async function handleSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const newUser = userCredential.user;

      await setDoc(doc(db, "users", newUser.uid), {
        firstName: firstname,
        lastName: lastname,
        email: email,
        status: "admin",
        createdAt: new Date().toISOString(),
      });

      alert("สร้างบัญชีแอดมินสำเร็จ!");
      router.push(`/admins/admin?uid=${uid}`);
    } catch (error: any) {
      console.error("Error creating admin:", error);
      setError("สร้างบัญชีไม่สำเร็จ: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  if (!uid) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black font-noto flex flex-col">
      <nav className="bg-gray-900/95 backdrop-blur-md p-4 w-full fixed z-50 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src="https://www.robotoops.com/MyDurian-KMUTNB/assets/images/icon_durian.png"
              className="w-12 h-12 hover:scale-110 transition-transform"
              alt="MyDurian Logo"
            />
            <Link
              href={`/admins/admin?uid=${uid}`}
              className="text-white font-bold text-2xl hover:text-lime-400 transition-all font-kanit"
            >
              MyDurian
            </Link>
          </div>

          <div className="hidden md:flex space-x-8">
            <Link
              href={`/admins/admin?uid=${uid}`}
              className="text-gray-300 hover:text-lime-400 transition-all relative group font-kanit"
            >
              หน้าแรก
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-lime-400 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
            </Link>
            <Link
              href={`/admins/adminsetting?uid=${uid}`}
              className="text-gray-300 hover:text-lime-400 transition-all relative group font-kanit"
            >
              ตั้งค่ายูเซอร์
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-lime-400 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
            </Link>
            <Link
              href={`/admins/add_admin?uid=${uid}`}
              className="text-gray-300 hover:text-lime-400 transition-all relative group font-kanit"
            >
              เพิ่มแอดมิน
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-lime-400 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
            </Link>
          </div>

          <div className="hidden md:flex space-x-4">
            <Link
              href="/"
              className="px-6 py-2 text-gray-300 hover:text-white border border-transparent hover:border-lime-400 rounded-lg transition-all font-kanit"
            >
              ออกจากระบบ
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-10 pb-10 flex items-center justify-center px-4">
        <div className="relative py-3 sm:max-w-xl w-full mt-16">
          <div className="relative py-10 bg-white/10 backdrop-blur-md shadow-xl rounded-3xl sm:p-16">
            <div className="max-w-md mx-auto">
              <div className="flex flex-col items-center space-y-4 mb-8">
                <div className="text-center">
                  <h2 className="text-4xl font-bold text-white mb-2">
                    MyDurian
                  </h2>
                  <h3 className="text-xl text-gray-200">Admin Register!</h3>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                  {error}
                </div>
              )}

              {!showOtpForm ? (
                <form onSubmit={handleSignup} className="space-y-6">
                  <div className="flex space-x-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="firstname"
                        className="block text-sm font-medium text-gray-200"
                      >
                        First Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstname"
                        name="firstname"
                        value={firstname}
                        onChange={(e) => setFirstname(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-300/20 
                                 text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                                 focus:ring-purple-500 focus:border-transparent transition duration-200"
                        placeholder="Enter your First Name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="lastname"
                        className="block text-sm font-medium text-gray-200"
                      >
                        Last Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastname"
                        name="lastname"
                        value={lastname}
                        onChange={(e) => setLastname(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-300/20 
                                 text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                                 focus:ring-purple-500 focus:border-transparent transition duration-200"
                        placeholder="Enter your Last Name"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-200"
                    >
                      Email <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-300/20 
                               text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                               focus:ring-purple-500 focus:border-transparent transition duration-200"
                      placeholder="Enter your Email"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-200"
                    >
                      Password <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-300/20 
                               text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                               focus:ring-purple-500 focus:border-transparent transition duration-200"
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="confirm_password"
                      className="block text-sm font-medium text-gray-200"
                    >
                      Confirm Password <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="password"
                      id="confirm_password"
                      name="confirm_password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-300/20 
                               text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                               focus:ring-purple-500 focus:border-transparent transition duration-200"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white 
                             font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 
                             focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-purple-200 
                             transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "กำลังสร้างบัญชี..." : "Create Admin Account"}
                  </button>
                </form>
              ) : (
                <form className="space-y-6">
                  <div className="space-y-2 mb-6">
                    <label
                      htmlFor="verifyOTP"
                      className="block text-sm font-medium text-gray-200"
                    >
                      Verify OTP!
                    </label>
                    <input
                      type="text"
                      id="verifyOTP"
                      name="verifyOTP"
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-300/20 
                               text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                               focus:ring-purple-500 focus:border-transparent transition duration-200"
                      placeholder="Enter your OTP"
                    />
                  </div>

                  <div className="h-6"></div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white 
                             font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 
                             focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-purple-200 
                             transition duration-200"
                  >
                    Verify OTP
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function AddAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-white text-xl">กำลังโหลด...</div>
        </div>
      }
    >
      <AddAdminContent />
    </Suspense>
  );
}
