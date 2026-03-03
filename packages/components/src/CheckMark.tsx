import { Show } from 'solid-js'
import Spinner from './Spinner'

type Props = {
  correct: () => boolean | undefined
}
export default function CheckMark(props: Props) {
  return (
    <Spinner>
      <Show when={props.correct() === true}>
        <span class="text-green-700">✓</span>
      </Show>
      <Show when={props.correct() === false}>
        <span class="text-red-900">❌</span>
      </Show>
    </Spinner>
  )
}
