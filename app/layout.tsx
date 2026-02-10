import '@/styles/globals.css'
import type { Metadata } from 'next'
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'Lead Management Dashboard',
  description: 'Manage and track leads across various divisions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
