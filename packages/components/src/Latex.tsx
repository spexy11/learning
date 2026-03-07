import katex from 'katex'
import 'katex/dist/katex.min.css'
import { Dynamic } from 'solid-js/web'

export default function Latex(props: { value: string; displayMode?: boolean }) {
  const html = () =>
    katex.renderToString(props.value, {
      displayMode: props.displayMode,
      strict: false,
      output: 'html',
      macros: {
        '\\placeholder': '',
        '\\dd': '\\mathrm{d}',
        '\\exponentialE': 'e',
        '\\imaginaryI': 'i',
      },
    })
  return <Dynamic component={props.displayMode ? 'div' : 'span'} innerHTML={html()} />
}
