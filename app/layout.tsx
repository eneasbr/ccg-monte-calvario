import type { Metadata } from 'next'
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
