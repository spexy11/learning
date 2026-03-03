import { type JSX, Suspense } from 'solid-js'
import spinner from './Spinner.svg'

export default function Spinner(props: { fallback?: JSX.Element; children: JSX.Element }) {
  return (
    <Suspense
      fallback={
        <>
          <img src={spinner} /> {props.fallback}
        </>
      }
    >
      {props.children}
    </Suspense>
  )
}
