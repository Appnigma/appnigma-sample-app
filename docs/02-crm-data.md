# 2. Read and write CRM data, in one shape

Code: [`server/src/features/customers.ts`](../server/src/features/customers.ts)

`crm.contacts`, `crm.companies` and `crm.deals` read and write a customer's CRM
in one shape, whichever CRM they use. The Customers page never asks whether it
is HubSpot, Attio or Pipedrive.

```ts
const [companies, contacts, deals] = await Promise.all([
  appnigma.crm.companies.list({ endCustomerId, platform, limit: 50 }),
  appnigma.crm.contacts.list({ endCustomerId, platform, limit: 50 }),
  appnigma.crm.deals.list({ endCustomerId, platform, limit: 50 }),
]);
```

Every field is always present: a value the CRM does not have is `null`, never missing.

| Object | Fields this app shows |
| --- | --- |
| Company | `name`, `domain` |
| Contact | `fullName`, `emails`, `companyId` |
| Deal | `name`, `amount`, `currency`, `status`, `stage.label`, `companyId` |

## Pages

A list answers `next`. Pass it back as `cursor` for the next page, while it is not `null`.

```ts
let page = await appnigma.crm.contacts.list({ endCustomerId, platform });
while (page.next) page = await appnigma.crm.contacts.list({ endCustomerId, platform, cursor: page.next });
```

## Writing

```ts
const { record } = await appnigma.crm.contacts.create({
  endCustomerId,
  platform,
  record: { firstName: "Ada", lastName: "Lovelace", emails: [{ value: "ada@example.com", type: "work", primary: true }] },
});
```

- A contact with an email, or a company with a domain, updates the record that already has it, so sending the same contact twice never makes a duplicate.
- For deals, pass your own `matchKey`, such as your invoice id, to get the same guarantee.
- `update` changes only the fields you send.
