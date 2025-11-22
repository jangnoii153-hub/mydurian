// src/app/users/layout.tsx
import NavbarUser from "@/components/NavbarUser";

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavbarUser />
      <main className="pt-20 min-h-screen">{children}</main>
    </>
  );
}
