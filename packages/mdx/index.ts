import mdx from '@mdx-js/rollup'
import { h } from 'hastscript'
import type { Root } from 'mdast'
import remarkDirective from 'remark-directive'
import remarkMath from 'remark-math'
import remarkSectionize from 'remark-sectionize'
import { visit } from 'unist-util-visit'

function myRemarkPlugin() {
  return function (tree: Root) {
    visit(tree, function (node) {
      if (
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective'
      ) {
        const data = node.data || (node.data = {})
        const hast = h(node.name, node.attributes || {})

        data.hName = hast.tagName
        data.hProperties = hast.properties
      }
    })
  }
}

export const mdxPlugin = () => [
  {
    ...mdx({
      jsx: true,
      jsxImportSource: 'solid-js',
      providerImportSource: 'solid-mdx',
      remarkPlugins: [remarkMath, remarkDirective, remarkSectionize, myRemarkPlugin],
    }),
    enforce: 'pre',
  },
]
