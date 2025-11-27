import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "360 Scene Editor | Cyberpunk Virtual Tour Creator",
  description: "Create immersive virtual tours with a node-based 360 scene editor. Craft, connect, and explore panoramic experiences.",
  keywords: ["360", "virtual tour", "panorama", "scene editor", "VR", "immersive"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
