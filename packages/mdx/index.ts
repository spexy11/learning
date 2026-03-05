import mdx from '@mdx-js/rollup'
import remarkDirective from 'remark-directive'
import remarkMath from 'remark-math'
import remarkSectionize from 'remark-sectionize'

export const mdxPlugin = () => [
  {
    ...mdx({
      jsx: true,
      jsxImportSource: 'solid-js',
      providerImportSource: 'solid-mdx',
      remarkPlugins: [remarkMath, remarkDirective, remarkSectionize],
    }),
    enforce: 'pre',
  },
]
