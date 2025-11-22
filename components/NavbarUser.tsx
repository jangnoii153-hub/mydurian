"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

function NavbarContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const uid = searchParams.get("uid");

  const navLinks = [
    { name: "หน้าแรก", href: "/users/home" },
    { name: "แดชบอร์ด", href: "/users/dashboard" },
    { name: "กราฟ", href: "/users/chart" },
    { name: "ดาวน์โหลดข้อมูล", href: "/users/table" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="bg-gray-900/95 backdrop-blur-md p-4 w-full fixed top-0 z-50 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link
          href={uid ? `/users/home?uid=${uid}` : "/users/home"}
          className="flex items-center space-x-4"
        >
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

        {/* Desktop Navigation */}
        <div className="hidden lg:flex space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={uid ? `${link.href}?uid=${uid}` : link.href}
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

        {/* Auth Button */}
        <div className="hidden lg:flex space-x-4">
          <Link
            href="/login"
            className="px-6 py-2 text-gray-300 hover:text-white border border-transparent hover:border-lime-400 rounded-lg transition-all font-kanit"
          >
            ออกจากระบบ
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
                href={uid ? `${link.href}?uid=${uid}` : link.href}
                className="block text-gray-300 hover:text-lime-400 transition-all font-kanit"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/login"
              className="block px-6 py-2 bg-lime-500 text-white rounded-lg hover:bg-lime-400 text-center font-kanit"
              onClick={() => setMobileMenuOpen(false)}
            >
              ออกจากระบบ
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default function NavbarUser() {
  return (
    <Suspense
      fallback={
        <nav className="bg-gray-900/95 backdrop-blur-md p-4 w-full fixed top-0 z-50 shadow-lg">
          <div className="container mx-auto">
            <div className="text-white">Loading...</div>
          </div>
        </nav>
      }
    >
      <NavbarContent />
    </Suspense>
  );
}
