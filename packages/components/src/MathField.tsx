import "mathlive";
import "mathlive/fonts.css";
import type { MathfieldElement, MathfieldElementAttributes } from "mathlive";
import { createEffect, createSignal, Show, splitProps } from "solid-js";

declare module "solid-js" {
  namespace JSX {
    type ElementProps<T> = {
      [K in keyof T]: Props<T[K]> & HTMLAttributes<T[K]>;
    };
    type Props<T> = {
      [K in keyof T as `prop:${string & K}`]?: T[K];
    };
    interface IntrinsicElements {
      "math-field": Partial<
        MathfieldElementAttributes & ElementProps<MathfieldElement>
      >;
    }
  }
}

type MathProps = Partial<MathfieldElementAttributes> & {
  name?: string;
};

export default function MathField(props: MathProps) {
  const [value, setValue] = createSignal(props.value);
  createEffect(() => setValue(props.value));
  const [local, attrs] = splitProps(props, ["name"]);
  const cls = () => {
    if (!props.readOnly) {
      return " border border-slate-300 rounded";
    }
  };

  return (
    <>
      <math-field
        class={`bg-transparent text-xl ${cls()}`}
        onInput={(e: InputEvent & { target: MathfieldElement }) =>
          setValue(e.target.value)
        }
        {...attrs}
        placeholder={`\\text{${attrs.placeholder}}`}
      />
      <Show when={props.name}>
        <input type="hidden" name={props.name} value={String(value() || "")} />
      </Show>
    </>
  );
}
