import { instance } from '@viz-js/viz'
import { createEffect, createSignal, onMount } from 'solid-js'

type Props = {
  class?: string
  value: string
}

type Viz = Awaited<ReturnType<typeof instance>>

export default function Dot(props: Props) {
  let container: HTMLDivElement
  const [viz, setViz] = createSignal<Viz | null>(null)

  onMount(async () => {
    setViz(await instance())
  })

  createEffect(() => {
    try {
      if (viz()) {
        const svg = viz()?.renderSVGElement(props.value)
        if (svg) {
          container!.innerHTML = ''
          container!.appendChild(svg)
        }
      }
    } catch (error) {
      console.log(error)
    }
  })

  return <div class={props.class} ref={container!} />
}
