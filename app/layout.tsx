import "./globals.css";
import Navbar from "./_components/Navbar";

export const metadata = {
  title: "Dongjue Xie",
  description: "Computer Science Student · Software Engineer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
