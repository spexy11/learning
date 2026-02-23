import { lazy, type ComponentProps } from "solid-js";
import { Dynamic } from "solid-js/web";
import type { View } from "./schemas";

type Props<T extends View<any>> = ComponentProps<T[keyof T]>;

export function loadView<T extends View<any>>(
  importModule: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    const { default: view } = await importModule();
    return {
      default: (props: Props<T>) => (
        <Dynamic component={view[props.step]} {...props} />
      ),
    };
  });
}
