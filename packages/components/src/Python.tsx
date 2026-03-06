import { runPython } from '@learning/repl'
import { createAsync } from '@solidjs/router'
import { ErrorBoundary } from 'solid-js'
import Spinner from './Spinner'

export default function Python(props: { value: string }) {
  const output = createAsync(() => runPython(props.value))
  return (
    <ErrorBoundary fallback={(error) => <pre>{error}</pre>}>
      <Spinner fallback="Executing code...">
        <pre>{output()}</pre>
      </Spinner>
    </ErrorBoundary>
  )
}
