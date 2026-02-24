import { lazy, splitProps, type JSX } from "solid-js";
import { Dynamic } from "solid-js/web";

const components = {
  input: "input",
  select: "select",
  latex: lazy(() => import("./MathField")),
  markdown: "textarea",
  textarea: "textarea",
} as const;

type Props = JSX.InputHTMLAttributes<HTMLInputElement> & {
  component?: keyof typeof components;
  chlidren?: JSX.Element;
  label?: string;
};

export default function Field(props: Props) {
  const [local, attrs] = splitProps(props, ["component"]);
  return (
    <label class="flex items-center gap-8">
      <span class="w-48 text-right">{props.label}</span>
      <Dynamic
        component={components[props.component ?? "input"]}
        class="border border-slate-300 p-2 grow my-1"
        {...attrs}
      >
        {props.children}
      </Dynamic>
    </label>
  );
}
