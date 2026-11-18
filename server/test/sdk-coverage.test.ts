import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { Appnigma } from "@appnigma/sdk";

// This sample shows every SDK call in a real place. This test reads every
// call the installed SDK has and fails when the app's code never makes one,
// so an SDK upgrade that adds a call shows up here.

const SOURCE_DIRECTORY = path.join(import.meta.dirname, "..", "src");

const sourceFilesIn = (directory: string): string[] =>
  readdirSync(directory).flatMap((name) => {
    const full = path.join(directory, name);
    if (statSync(full).isDirectory()) return sourceFilesIn(full);
    return full.endsWith(".ts") ? [full] : [];
  });

// Every call on the client by its dotted name: catalog, crm.contacts.list, logic.goLive, and so on.
const callsOn = (value: object, prefix: string): string[] =>
  Object.entries(value).flatMap(([key, member]: [string, unknown]) => {
    const name = prefix ? `${prefix}.${key}` : key;
    if (typeof member === "function") return [name];
    if (typeof member === "object" && member !== null) return callsOn(member, name);
    return [];
  });

const appSource = sourceFilesIn(SOURCE_DIRECTORY)
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");

// Never sent anywhere: the client is only read, not called. It needs a key of
// the right shape to be made.
const UNUSED_KEY = "apn_live_coverage_check_never_sent";

const sdkCalls = callsOn(new Appnigma({ key: UNUSED_KEY }), "");

test("the client has the calls this test expects to walk", () => {
  assert.ok(sdkCalls.length > 40, `found only ${sdkCalls.length} calls on the client`);
  for (const known of ["catalog", "connections.connect", "crm.deals.update", "logic.goLiveStatus", "records.changes"]) assert.ok(sdkCalls.includes(known), `${known} is missing`);
});

test("the app makes every SDK call somewhere", () => {
  const unused = sdkCalls.filter((call) => !appSource.includes(`appnigma.${call}(`));
  assert.deepEqual(unused, [], `never called: ${unused.join(", ")}`);
});

test("the webhook receiver checks signatures with the SDK's helper", () => {
  assert.ok(appSource.includes("verifyWebhook("), "verifyWebhook is never called");
});
