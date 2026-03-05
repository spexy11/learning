import { lazy, Show, type JSX } from 'solid-js'

const MathField = lazy(() => import('@learning/components/src/MathField'))

const components = {
  h1: (props: JSX.HTMLAttributes<HTMLHeadingElement>) => <h1 class="text-sky-900" {...props} />,
  h2: (props: JSX.HTMLAttributes<HTMLHeadingElement>) => <h2 class="text-sky-800" {...props} />,
  code: (props: JSX.HTMLAttributes<HTMLElement> & { className?: string }) => (
    <Show when={props.className?.includes('math-inline')} fallback={<code {...props} />}>
      <MathField value={props.children} readOnly />
    </Show>
  ),
}

// @ts-ignore
import { MDXProvider } from 'solid-mdx'

export function ComponentProvider(props: { children: JSX.Element }) {
  return <MDXProvider components={components}>{props.children}</MDXProvider>
}
