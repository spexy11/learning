import { ComponentProvider } from '@learning/mdx/components'
import { Router } from '@solidjs/router'
import { FileRoutes } from '@solidjs/start/router'
import { Suspense } from 'solid-js'
import './app.css'

export default function App() {
  return (
    <Router
      root={(props) => (
        <main class="prose prose-code:before:content-none prose-code:after:content-none mx-auto">
          <ComponentProvider>
            <Suspense>{props.children}</Suspense>
          </ComponentProvider>
        </main>
      )}
    >
      <FileRoutes />
    </Router>
  )
}
