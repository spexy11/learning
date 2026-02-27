import { lazy, splitProps, type JSX } from "solid-js";
import { Dynamic } from "solid-js/web";

const components = {
  input: "input",
  select: "select",
  latex: lazy(() => import("./MathField")),
  math: lazy(() => import("./MathField")),
  markdown: "textarea",
  textarea: "textarea",
} as const;

type Props = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  type?: keyof typeof components;
  chlidren?: JSX.Element;
  label?: string;
  hideLabel?: boolean;
};

export default function Field(props: Props) {
  const [local, attrs] = splitProps(props, ["type"]);
  return (
    <label classList={{ "flex items-center gap-8": props.hideLabel !== true }}>
      <span
        classList={{
          "w-48 text-right": props.hideLabel !== false,
          hidden: props.hideLabel,
        }}
      >
        {props.label}
      </span>
      <Dynamic
        component={components[props.type ?? "input"]}
        classList={{
          "border border-slate-300 p-2 grow my-1": !props.readOnly,
        }}
        placeholder={props.title}
        {...attrs}
      >
        {props.children}
      </Dynamic>
    </label>
  );
}
