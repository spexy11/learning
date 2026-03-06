import { lazy, onMount, Show, type JSX } from 'solid-js'

const Latex = lazy(() => import('@learning/components/src/Latex'))

const components = {
  h1: (props: JSX.HTMLAttributes<HTMLHeadingElement>) => <h1 class="text-sky-900" {...props} />,
  h2: (props: JSX.HTMLAttributes<HTMLHeadingElement>) => <h2 class="text-sky-800" {...props} />,
  code: (props: JSX.HTMLAttributes<HTMLElement> & { className?: string }) => (
    <Show when={props.className?.includes('math-')} fallback={<code {...props} />}>
      <Latex
        value={String(props.children)}
        displayMode={props.className?.includes('math-display')}
      />
    </Show>
  ),
  pre: (props: JSX.HTMLAttributes<HTMLPreElement>) => (
    <pre class="bg-transparent text-black" {...props} />
  ),
} as const

const slideshow = {
  h1: (props: JSX.HTMLAttributes<HTMLHeadingElement>) => {
    let element!: HTMLHeadingElement
    onMount(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) history.replaceState(null, '', `#${entry.target.id}`)
          })
        },
        { root: null, threshold: 0.5 },
      )
      observer.observe(element)
    })
    return (
      <h1
        ref={element}
        class="-mx-4 bg-slate-700 px-4 py-3 text-4xl font-semibold text-slate-100 md:snap-start"
        id={String(props.children)?.toLowerCase().replace(/\s+/g, '-')}
        {...props}
      />
    )
  },
  section: (props: JSX.HTMLAttributes<HTMLElement>) => {
    return <section class="px-4 has-[h1]:h-270 has-[h1]:w-480">{props.children}</section>
  },
} as const

// @ts-ignore
import { MDXProvider } from 'solid-mdx'

export function ComponentProvider(props: { children: JSX.Element }) {
  return <MDXProvider components={components}>{props.children}</MDXProvider>
}

export function SlideLayout(props: { children: JSX.Element }) {
  return (
    <div class="prose-xl h-270 w-480 snap-y snap-mandatory snap-always overflow-x-hidden overflow-y-scroll shadow">
      <MDXProvider components={slideshow}>{props.children}</MDXProvider>
    </div>
  )
}

export function Page(props: { children: JSX.Element }) {
  return <div class="prose mx-auto">{props.children}</div>
}
