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

    const useNavbarUser17 =
      pathname === "/users/home17" || pathname === "/users/dashboard17";

    return (
      <>
        {useNavbarUser17 ? <NavbarUser17 /> : <NavbarUser />}
        <main className="pt-20 min-h-screen">{children}</main>
      </>
    );
}