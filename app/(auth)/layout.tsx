import { Inter } from "next/font/google";
import "../globals.css";
import { ClerkProvider } from "@clerk/nextjs";
export const metadata = {
  title: "Threads",
  description: "A Next.js 13 Meta Threads Application",
};
const inter = Inter({ subsets: ["latin"] });
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} bg-black `}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
