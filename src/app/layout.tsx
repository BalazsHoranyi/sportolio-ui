import type { Metadata } from "next"
import "./globals.css"
import { SkipToContentLink } from "@/components/layout/skip-to-content-link"

export const metadata: Metadata = {
  title: "Sportolo UI",
  description: "Strength routine builder"
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <SkipToContentLink />
        {children}
      </body>
    </html>
  )
}
