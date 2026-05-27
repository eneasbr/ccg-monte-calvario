import type { Metadata } from 'next'
import type { Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Founding Partners — CCG Monte Calvário',
  description: 'Campanha de construção da nova sede da CCG Monte Calvário em São Mateus, São Paulo.',
  keywords: ['CCG Monte Calvário', 'campanha', 'construção', 'parceiros fundadores'],
  openGraph: {
    title: 'Founding Partners — CCG Monte Calvário',
    description: 'Juntos estamos construindo um lugar sagrado para todos.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}