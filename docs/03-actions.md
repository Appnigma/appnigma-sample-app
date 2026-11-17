# 3. Run ready-made actions

Code: [`server/src/services/calls.service.ts`](../server/src/services/calls.service.ts)

Actions are ready-made jobs on a platform that Appnigma writes and keeps up to
date, such as reading a Gong call's transcript. This app's Calls page uses two.

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
- This app checks each output with a small schema ([`schemas/action.schemas.ts`](../server/src/schemas/action.schemas.ts)).
  You can also run `npx appnigma types` to write typed definitions for every action and function.
- A run is made once and never retried, because only you know whether repeating it is harmless.
