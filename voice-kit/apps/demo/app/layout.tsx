import type { Metadata } from 'next'
import { Archivo_Black as Display, JetBrains_Mono as Mono } from 'next/font/google'
import { SITE_URL } from '@/lib/site'
import './globals.css'

const mono = Mono({ subsets: ['latin'], variable: '--font-mono' })
const display = Display({ subsets: ['latin'], weight: '400', variable: '--font-display' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Noor · Ghost Navigator',
  description: 'Noor, the bilingual AI voice guide for Dubai Silicon Oasis.'
}

export default function RootLayout ({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className={`${mono.variable} ${display.variable}`}>
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
