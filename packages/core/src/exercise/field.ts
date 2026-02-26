import * as v from "valibot";

function schema<T extends v.BaseSchema<any, any, any>>(s: T) {
  return {
    ...s,
    meta: (data: { label: string; description: string }) => {
      return v.pipe(s, v.title(data.label), v.description(data.description));
    },
  };
}

const fields = {
  get markdown() {
    return schema(v.pipe(v.string(), v.metadata({ type: "markdown" })));
  },
  get math() {
    return schema(v.pipe(v.string(), v.metadata({ type: "latex" })));
  },
  get select() {
    return {
      options: <const S extends string>(...values: S[]) => {
        return schema(
          v.union(
            values.map((s) => v.literal(s)) as readonly v.LiteralSchema<
              S,
              undefined
            >[],
          ),
        );
      },
    };
  },
};

export function field<const T extends keyof typeof fields>(type: T) {
  return fields[type];
}
