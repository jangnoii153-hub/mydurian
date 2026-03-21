"use client";

import NavbarUser from "@/components/NavbarUser";
import NavbarUser17 from "@/components/NavbarUser17";
import { usePathname } from "next/navigation";

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navbar17Pages = [
    "/users/home17",
    "/users/dashboard17",
    "/users/chart17",
    "/users/table17",
  ];

  const useNavbarUser17 = navbar17Pages.some((p) => pathname.startsWith(p));

  return (
    <>
      {useNavbarUser17 ? <NavbarUser17 /> : <NavbarUser />}
      <main className="pt-20 min-h-screen">{children}</main>
    </>
  );
}