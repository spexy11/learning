import { ErrorBoundary, type JSX, Suspense } from 'solid-js'
import Button from './Button'
import spinner from './Spinner.svg'

export default function Spinner(props: { fallback?: JSX.Element; children: JSX.Element }) {
  return (
    <ErrorBoundary
      fallback={(error, retry) => (
        <div>
          <p>Une erreur s'est produite</p>
          <pre>{error}</pre>
          <Button onclick={retry}>Réessayer</Button>
        </div>
      )}
    >
      <Suspense
        fallback={
          <div class="flex items-center gap-8">
            <img src={spinner} /> <div>{props.fallback}</div>
          </div>
        }
      >
        {props.children}
      </Suspense>
    </ErrorBoundary>
  )
}
