"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Resume", href: "/resume" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="w-full">
      <div className="mx-auto max-w-[1200px] px-8 py-6">
        <nav className="flex items-center gap-12">
          {/* Name */}
          <Link href="/" className="font-semibold text-sm">
            Dongjue Xie
          </Link>

          {/* Nav links */}
          <div className="flex gap-10">
            {items.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    relative text-sm font-medium
                    after:absolute after:left-0 after:-bottom-1
                    after:h-[2px] after:w-full after:bg-black
                    after:opacity-0 after:transition-opacity
                    hover:after:opacity-100
                    ${active ? "after:opacity-100" : ""}
                  `}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
