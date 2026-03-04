import mdx from '@mdx-js/rollup'
import remarkDirective from 'remark-directive'
import remarkMath from 'remark-math'

export const mdxPlugin = () => [
  {
    ...mdx({
      jsx: true,
      jsxImportSource: 'solid-js',
      providerImportSource: 'solid-mdx',
      remarkPlugins: [remarkMath, remarkDirective],
    }),
    enforce: 'pre',
  },
]
