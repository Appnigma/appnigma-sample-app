import type { JsonObject } from "@appnigma/sdk";
import { cellOf, outputViewOf } from "../lib/actions";
import { wordsOf } from "../lib/format";
import { ViewCode } from "./ViewCode";

const JsonBlock = ({ value }: { value: JsonObject }) => (
  <pre className="max-h-96 overflow-auto rounded-md bg-slate-950 p-3 font-mono text-xs text-emerald-300">{JSON.stringify(value, null, 2)}</pre>
);

// What an action sent back: each list of records as a table, the rest as
// JSON, and the whole answer as JSON one click away.
const ActionOutput = ({ output }: { output: JsonObject }) => {
  const { tables, rest } = outputViewOf(output);
  if (tables.length === 0 && !rest) return <p className="text-slate-500">It ran, and nothing came back.</p>;
  return (
    <div className="space-y-4">
      {tables.map((table) => (
        <div key={table.key}>
          <p className="font-medium text-slate-800">
            {wordsOf(table.key)} <span className="font-normal text-slate-400">{table.rows.length}</span>
          </p>
          <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  {table.columns.map((column) => (
                    <th key={column} className="whitespace-nowrap px-4 py-2.5">
                      {wordsOf(column)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, index) => (
                  <tr key={index} className="border-t border-slate-100">
                    {table.columns.map((column) => {
                      const text = cellOf(row[column]);
                      return (
                        <td key={column} title={text} className="max-w-xs truncate px-4 py-2.5 text-slate-700">
                          {text}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      {rest && <JsonBlock value={rest} />}
      {tables.length > 0 && (
        <ViewCode label="View the whole answer as JSON">
          <JsonBlock value={output} />
        </ViewCode>
      )}
    </div>
  );
};

export { ActionOutput };
