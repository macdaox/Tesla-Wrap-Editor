import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tesla Wrap Editor - 3D Car Customizer & AI Design Tool",
  description: "Customize your Tesla Model 3, Model Y, and Cybertruck with our advanced 3D wrap editor. Features AI texture generation, custom color gradients, and instant preview. Design your dream car wrap today.",
  keywords: "Tesla wrap, car wrap editor, vehicle customization, Cybertruck wrap, Model 3 wrap, AI car design, 3D car config, vinyl wrap simulator, Tesla customization",
  openGraph: {
    title: "Tesla Wrap Editor - Design Your Dream Car",
    description: "Try the world's most advanced AI-powered Tesla wrap visualizer. Customize Cybertruck, Model 3, and Model Y instantly.",
    type: "website",
    siteName: "Tesla Wrap Editor",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tesla Wrap Editor - AI Powered Customization",
    description: "Design your custom Tesla wrap in seconds with AI texture generation.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
