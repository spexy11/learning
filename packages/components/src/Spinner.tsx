import { type JSX, Suspense } from 'solid-js'
import spinner from './Spinner.svg'

export default function Spinner(props: { fallback?: JSX.Element; children: JSX.Element }) {
  return (
    <Suspense
      fallback={
        <div class="flex items-center gap-8">
          <img src={spinner} /> <div>{props.fallback}</div>
        </div>
      }
    >
      {props.children}
    </Suspense>
  )
}
