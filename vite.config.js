import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Change 'quiz-game' to match your GitHub repository name
  base: '/quiz-game/'
})
