import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Base path:
// - On GitHub Pages: /Teacher-s-HW-Desk---Daily-Homework-WhatsApp-Tracker/
// - On Vercel / Netlify / Custom Domain: / (root)
// Using './' or conditional ensures it works everywhere!
export default defineConfig({
  base: process.env.VERCEL ? '/' : './',
  plugins: [
    react(),
    tailwindcss()
  ],
})
