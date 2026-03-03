import * as v from 'valibot'

const defaultMeta = {
  type: 'input',
  label: '',
  description: '',
}

const BaseField = <
  const S extends v.BaseSchema<any, any, any>,
  const O extends Record<string, any>,
>(
  schema: S,
  metaOverride: O,
) => {
  return {
    ...v.pipe(schema, v.metadata({ ...defaultMeta, ...metaOverride })),
    meta(rawInfo: Partial<typeof defaultMeta & O>) {
      return v.pipe(
        schema,
        v.title(rawInfo.label ?? ''),
        v.description(rawInfo.description ?? ''),
        v.metadata({ ...defaultMeta, ...metaOverride, ...rawInfo }),
      )
    },
  }
}

const fields = {
  markdown: BaseField(v.string(), { type: 'markdown' as const }),
  math: BaseField(v.string(), { type: 'latex' as const }),
  get select() {
    return {
      options: <const O extends Record<string, string>>(opts: O) => {
        return BaseField(
          v.union(
            Object.keys(opts).map((s) => v.literal(s)) as {
              [K in keyof O]: v.LiteralSchema<K, undefined>
            }[keyof O][],
          ),
          { type: 'select' as const, options: opts },
        )
      },
    }
  },
}

export function field<const T extends keyof typeof fields>(type: T) {
  return fields[type]
}
