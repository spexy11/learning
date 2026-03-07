import { runPython } from '@learning/repl'
import { createAsync } from '@solidjs/router'
import { ErrorBoundary, Show } from 'solid-js'
import Button from './Button'
import Spinner from './Spinner'

export default function Python(props: { value: string }) {
  const output = createAsync(async () => runPython(props.value))
  return (
    <ErrorBoundary
      fallback={(error, retry) => (
        <div>
          <h3>Une erreur s'est produite</h3>
          <p>{error}</p>
          <Button onClick={retry}>Réessayer</Button>
        </div>
      )}
    >
      <Spinner fallback="Executing code...">
        <Show when={output()?.result}>
          <pre>{output()?.result}</pre>
        </Show>
        <Show when={output()?.stdout}>
          <h6 class="mb-0 [font-variant:small-caps]">Stdout</h6>
          <pre class="mt-0">{output()?.stdout}</pre>
        </Show>
        <Show when={output()?.error}>
          <h6 class="mb-0 [font-variant:small-caps]">Error</h6>
          <pre>{output()?.error}</pre>
        </Show>
      </Spinner>
    </ErrorBoundary>
  )
}
