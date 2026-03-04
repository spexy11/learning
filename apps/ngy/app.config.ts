import { mdxPlugin } from '@learning/mdx'
import { defineConfig } from '@solidjs/start/config'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  extensions: ['mdx'],
  routeDir: '../../../content/ngy',
  vite: {
    plugins: [mdxPlugin(), tailwindcss()],
  },
})
