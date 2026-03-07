import { useMatch } from '@solidjs/router'
import { type JSX } from 'solid-js'
export function Navbar() {
  return (
    <nav class="mb-8 bg-cyan-950 text-cyan-50 shadow">
      <ul class="mx-auto flex max-w-4xl gap-4 font-bold">
        <li>
          <NavLink href="/">Home</NavLink>
        </li>
        <li>
          <NavLink href="/learning">Learning</NavLink>
        </li>
      </ul>
    </nav>
  )
}

function NavLink(props: JSX.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const match = useMatch(() => props.href || '')
  return (
    <a
      class="block border-b-4 border-cyan-950 p-4 hover:border-cyan-600 hover:bg-cyan-900"
      classList={{ 'border-cyan-500': Boolean(match()) }}
      {...props}
    />
  )
}
