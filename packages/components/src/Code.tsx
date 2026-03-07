import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { python } from '@codemirror/lang-python'
import { clientOnly } from '@solidjs/start'
import { basicSetup, EditorView } from 'codemirror'
import { createEffect, createSignal, onMount, Show } from 'solid-js'

const languages = {
  javascript,
  json,
  typescript: javascript,
  python,
}

const Python = clientOnly(() => import('./Python'))

type Props = {
  before?: string
  children?: string
  lang?: keyof typeof languages
  class?: string
  value: string
  run?: boolean
}

export default function Code(props: Props) {
  const [value, setValue] = createSignal('')
  createEffect(() => {
    if (props.value) setValue(props.value)
  })
  createEffect(() => {
    if (props.children) setValue(props.children)
  })

  let container: HTMLDivElement | undefined
  let view: EditorView | undefined
  onMount(() => {
    view = new EditorView({
      doc: value(),
      parent: container,
      extensions: [
        basicSetup,
        EditorView.updateListener.of((update) => {
          console.log('Update')
          if (update.docChanged) {
            setValue(update.state.doc.toString())
          }
        }),
        ...(props.lang ? [languages[props.lang]()] : []),
      ],
    })
  })

  createEffect(() => {
    if (view && props.value !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: props.value },
      })
    }
  })

  return (
    <>
      <div ref={container} class={props.class ?? 'rounded-xl border border-slate-200 shadow'} />
      <Show when={props.run && props.lang === 'python'}>
        <Python value={`${props.before ?? ''}\n${value()}`} />
      </Show>
    </>
  )
}
