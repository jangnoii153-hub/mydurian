// src/components/layout/Navbar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "หน้าแรก", href: "/" },
    { name: "แดชบอร์ด", href: "/dashboardExam" },
    { name: "กราฟ", href: "/chartExam" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="bg-gray-900/95 backdrop-blur-md p-4 w-full fixed top-0 z-50 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-4">
          <Image
            src="https://www.robotoops.com/MyDurian-KMUTNB/assets/images/icon_durian.png"
            alt="MyDurian Logo"
            width={48}
            height={48}
            className="hover:scale-110 transition-transform"
            unoptimized
          />
          <span className="text-white font-bold text-2xl hover:text-lime-400 transition-all font-kanit">
            MyDurian
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative group font-kanit transition-all ${
                isActive(link.href)
                  ? "text-lime-400"
                  : "text-gray-300 hover:text-lime-400"
              }`}
            >
              {link.name}
              <span
                className={`absolute bottom-0 left-0 w-full h-0.5 bg-lime-400 transform transition-transform ${
                  isActive(link.href)
                    ? "scale-x-100"
                    : "scale-x-0 group-hover:scale-x-100"
                }`}
              />
            </Link>
          ))}
        </div>

        {/* Auth Buttons */}
        <div className="hidden lg:flex space-x-4">
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

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden text-white"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-gray-900/95 p-6 space-y-6 lg:hidden">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-gray-300 hover:text-lime-400 transition-all font-kanit"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/login"
              className="block px-6 py-2 text-gray-300 hover:text-white border border-lime-400 rounded-lg text-center font-kanit"
              onClick={() => setMobileMenuOpen(false)}
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/signup"
              className="block px-6 py-2 bg-lime-500 text-white rounded-lg hover:bg-lime-400 text-center font-kanit"
              onClick={() => setMobileMenuOpen(false)}
            >
              สมัครสมาชิก
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
