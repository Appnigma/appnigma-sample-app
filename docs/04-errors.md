# 4. Handle every failure

Code: [`server/src/errors.ts`](../server/src/errors.ts)

Every SDK failure is an error class you can catch by name, and all of them extend
`SdkError`. This app turns each one into a message its user can act on, in one place.

| Error | What it means | What this app tells the user |
| --- | --- | --- |
| `SdkNotFoundError` | Not connected, or no such record | "That is not connected yet." |
| `SdkReconnectError` | The customer must approve again | "Connect it again." |
| `SdkAuthError` with `PLATFORM_NOT_ENABLED` | That platform is not switched on for you | "That integration is not available yet." |
| `SdkNotAvailableError` | No shared shape for that data yet | "That data is not available for this platform yet." |
| `SdkInputError` | A field is wrong; `problems` names each one | The problems, field by field |
| `SdkPlatformRefusedError` | The platform itself said no | The platform's reason |
| `SdkRateLimitError` | Too many calls | "Try again in a moment." |
| `SdkNetworkError` | Appnigma could not be reached | "Could not reach the integrations service." |
| any other `SdkError` | Something failed on Appnigma's side | A short message, and the request id in your logs |

```ts
if (error instanceof SdkReconnectError) return fail(response, 409, "This connection stopped working. Connect it again.");
if (error instanceof SdkNotFoundError) return fail(response, 404, "That is not connected yet.");
```

When you write to support@appnigma.ai, quote the error's `requestId`, never your key.

Retries are built in: reads, and writes that are safe to repeat, are tried again
on network errors, 5xx and 429. Creating links, running actions and creates with
nothing to match on are made once.
