# 3. Run ready-made actions

Code: [`server/src/features/actions.ts`](../server/src/features/actions.ts) and [`server/src/features/calls.ts`](../server/src/features/calls.ts)

Actions are ready-made jobs on a platform that Appnigma writes and keeps up to
date, such as reading a Gong call's transcript. Each integration's Actions tab
lists the ones its platform has, draws a form from each one's input schema and
runs the one picked. This app's Calls page uses two of Gong's.

```ts
const { output } = await appnigma.actions.run({
  endCustomerId,
  platform: "gong",
  action: "get-call-transcript",
  input: { callId },
});
```

- `actions.list({ platform })` names every action, with the JSON Schema of its input and output.
- The input is checked before the action runs; a wrong field is an `SdkInputError` naming it.
- This app checks each output with a small schema (in [`features/calls.ts`](../server/src/features/calls.ts)).
  You can also run `npx appnigma types` to write typed definitions for every action and function.
- A run is made once and never retried, because only you know whether repeating it is harmless.
