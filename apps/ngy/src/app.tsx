import { ComponentProvider } from '@learning/mdx/layouts'
import { Router } from '@solidjs/router'
import { FileRoutes } from '@solidjs/start/router'
import { Suspense } from 'solid-js'
import './app.css'

export default function App() {
  return (
    <Router
      root={(props) => (
        <ComponentProvider>
          <Suspense>{props.children}</Suspense>
        </ComponentProvider>
      )}
    >
      <FileRoutes />
    </Router>
  )
}
