import { JSX } from 'solid-js'
import { Navbar } from './Navbar'

type Props = {
  children: JSX.Element
}

export function Page(props: Props) {
  return (
    <>
      <Navbar />
      <main class="prose prose-code:before:content-none prose-code:after:content-none mx-auto max-w-4xl p-4">
        {props.children}
      </main>
    </>
  )
}
