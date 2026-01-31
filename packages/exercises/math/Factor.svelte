<script lang="ts">
  import type { Props } from "@learning/core";
  let props: Props<typeof import("./Factor.ts")> = $props();
</script>

{#if props.step === "start"}
  <p>
    Factorise <strong>complètement</strong> l'expression: {props.question.expr}
  </p>
  <input value={props.state?.attempt} />
  {(await props.feedback)?.equal}
{:else if props.step === "root"}
  <p></p>
{/if}
