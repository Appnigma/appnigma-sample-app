import type { JsonObject, JsonValue } from "@appnigma/sdk";
import type { ActionField } from "@server-types";
import { BOOLEAN_CHOICES, NOT_SET_CHOICE } from "../constants/actions";
import type { ActionOutputView, Choice, OutputTable } from "../types/ui.types";
import { wordsOf } from "./format";

const isRecord = (value: JsonValue): value is JsonObject => typeof value === "object" && value !== null && !Array.isArray(value);

const isScalar = (value: JsonValue): value is string | number | boolean | null => value === null || typeof value !== "object";

// What a Yes/No or a listed field offers, with Not set first when it may be left out.
const choicesOf = (field: ActionField): Choice[] => {
  const listed = field.type === "boolean" ? BOOLEAN_CHOICES : field.choices.map((choice) => ({ value: choice, chip: wordsOf(choice) }));
  return field.required ? listed : [NOT_SET_CHOICE, ...listed];
};

// What was typed in a JSON box, read as JSON.
const jsonIn = (typed: string, label: string): JsonValue => {
  try {
    const parsed: JsonValue = JSON.parse(typed);
    return parsed;
  } catch {
    throw new Error(`${label} is not valid JSON.`);
  }
};

// A field's value as the action takes it, from what its box says.
const valueOf = (field: ActionField, typed: string): JsonValue => {
  const label = wordsOf(field.name);
  if (field.type === "number" || field.type === "integer") {
    const number = Number(typed);
    if (!Number.isFinite(number)) throw new Error(`${label} should be a number.`);
    return number;
  }
  if (field.type === "boolean") return typed === "true";
  if (field.type === "list") {
    return typed
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter((item) => item !== "");
  }
  if (field.type === "json") return jsonIn(typed, label);
  return typed;
};

// The form as the action's input. An empty box is left out, so the action
// uses its own default for it; an empty required one stops the run here.
const inputOf = (fields: ActionField[], values: Record<string, string>): JsonObject => {
  const input: JsonObject = {};
  for (const field of fields) {
    const typed = (values[field.name] ?? "").trim();
    if (typed !== "") input[field.name] = valueOf(field, typed);
    else if (field.required) throw new Error(`${field.type === "boolean" || field.type === "choice" ? "Choose" : "Fill in"} ${wordsOf(field.name)} first.`);
  }
  return input;
};

// The whole input typed as JSON, for an action whose input is not one set of fields.
const typedInputOf = (typed: string): JsonObject => {
  const parsed = jsonIn(typed, "The input");
  if (!isRecord(parsed)) throw new Error("The input should be a JSON object.");
  return parsed;
};

// What a record is called, when it says: its label, name or title.
const nameOf = (record: JsonObject): string | null => {
  const name = record.label ?? record.name ?? record.title;
  return typeof name === "string" && name.trim() !== "" ? name : null;
};

// A list in a cell: its values, or what each of its records is called,
// joined; only counted when they don't all say.
const listOf = (items: JsonValue[]): string => {
  const words = items.map((item) => (isRecord(item) ? nameOf(item) : isScalar(item) ? String(item ?? "—") : null));
  return words.every((word) => word !== null) ? words.join(", ") : `${items.length} ${items.length === 1 ? "item" : "items"}`;
};

// One cell of a table: a value in plain words, a list joined, and a record written as JSON.
const cellOf = (value: JsonValue | undefined): string => {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length === 0 ? "—" : listOf(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const columnsOf = (rows: JsonObject[]): string[] => [...new Set(rows.flatMap((row) => Object.keys(row)))];

// Each list of records at the top of an action's answer, as a table; the rest of it as JSON.
const outputViewOf = (output: JsonObject): ActionOutputView => {
  const tables: OutputTable[] = [];
  const rest: JsonObject = {};
  for (const [key, value] of Object.entries(output)) {
    if (Array.isArray(value) && value.length > 0 && value.every(isRecord)) tables.push({ key, columns: columnsOf(value), rows: value });
    else rest[key] = value;
  }
  return { tables, rest: Object.keys(rest).length > 0 ? rest : null };
};

export { cellOf, choicesOf, inputOf, outputViewOf, typedInputOf };
