// src/app/login/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        username,
        password
      );
      const user = userCredential.user;

      // Check UID of admin
      if (user.uid === "46LyYu28VCOHW2UvCspi2aDbpZC3") {
        router.push(`/admins/admin?uid=${user.uid}`);
      } else {
        router.push(`/users/home?uid=${user.uid}`);
      }
    } catch (error: any) {
      console.error("Error signing in:", error);
      setError("เข้าสู่ระบบไม่สำเร็จ: " + error.message);
      setLoading(false);
    }
  }

  return (
    <>
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 pt-10 pb-10 flex items-center justify-center px-4">
          <div className="relative py-3 sm:max-w-xl w-full mt-16">
            {/* Card container with shadow and glass effect */}
            <div className="relative py-10 bg-white/10 backdrop-blur-md shadow-xl rounded-3xl sm:p-16">
              <div className="max-w-md mx-auto">
                {/* Logo and Header */}
                <div className="flex flex-col items-center space-y-4 mb-8">
                  <img
                    src="https://www.robotoops.com/MyDurian-KMUTNB/assets/images/icon_durian.png"
                    alt="MyDurian Logo"
                    className="w-20 h-20"
                  />
                  <div className="text-center">
                    <h2 className="text-4xl font-bold text-white mb-2">
                      MyDurian
                    </h2>
                    <h3 className="text-xl text-gray-200">Welcome back!</h3>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                    {error}
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                  {/* Username Input */}
                  <div className="space-y-2">
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium text-gray-200"
                    >
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-300/20 
                               text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                               focus:ring-purple-500 focus:border-transparent transition duration-200"
                      placeholder="Enter your username"
                      required
                    />
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-200"
                    >
                      Password
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

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="remember-me"
                        name="remember-me"
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <label
                        htmlFor="remember-me"
                        className="ml-2 block text-sm text-gray-200"
                      >
                        Remember me
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => e.preventDefault()}
                      className="text-sm text-purple-300 hover:text-purple-200"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white 
                             font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 
                             focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-purple-200 
                             transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "กำลังเข้าสู่ระบบ..." : "Sign in"}
                  </button>
                </form>

                {/* Sign Up Link */}
                <div className="text-center mt-6">
                  <p className="text-gray-200">
                    Don&apos;t have an account?{" "}
                    <Link
                      href="/signup"
                      className="text-purple-300 hover:text-purple-200 font-semibold"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </>
  );
}
