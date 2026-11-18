# 5. New integrations, without new code

Code: [`server/src/features/integrations.ts`](../server/src/features/integrations.ts)

The Integrations page is built from `platforms.list()`. When Appnigma ships a
new integration for you, it shows up there, ready to connect. Your team does
not write or deploy anything.

```mermaid
sequenceDiagram
  participant C as Your customer
  participant T as Your team
  participant A as Appnigma
  participant P as Your product
  C->>T: "We use Gong, can you add it?"
  T->>A: ask, in your shared Slack channel or from Claude Code
  A->>A: build, test, open a pull request
  A->>T: Slack: pull request ready
  T->>A: approve
  A->>P: Gong is now in platforms.list()
  P->>C: Gong appears, ready to connect
```

```ts
const { platforms } = await appnigma.platforms.list();
// [{ platform: "hubspot", label: "HubSpot", ... }, { platform: "gong", ... }]
```

To ask from your editor, see [docs/06-claude-code.md](06-claude-code.md).
