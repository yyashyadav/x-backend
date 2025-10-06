import './globals.css'

export const metadata = {
  title: 'B2B Matchmaking Platform',
  description: 'Connect businesses for investment, acquisition, and growth opportunities',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
