import type { RecordedCall, TranscriptPart } from "@server-types";
import { Clock, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api, messageOf } from "../api/client";
import { Avatar } from "../components/Avatar";
import { EmptyState } from "../components/EmptyState";
import { PlatformLogo } from "../components/PlatformLogo";
import { PageSkeleton, Skeleton } from "../components/Skeleton";
import { CALL_PLATFORM } from "../constants/platforms";
import { markDone } from "../lib/progress";

const isCustomer = (part: TranscriptPart): boolean => (part.speakerName ?? "").toLowerCase().includes("customer");

// Recorded calls from Gong, read with a ready-made action. Until a customer
// connects Gong, this page sends them to the integrations page.
const CallsPage = () => {
  const [calls, setCalls] = useState<RecordedCall[] | null>(null);
  const [transcript, setTranscript] = useState<TranscriptPart[] | null>(null);
  const [selected, setSelected] = useState<RecordedCall | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setCalls((await api.calls()).calls);
      } catch (failure) {
        setError(messageOf(failure));
      }
    })();
  }, []);

  const open = async (call: RecordedCall) => {
    setSelected(call);
    setTranscript(null);
    try {
      setTranscript((await api.transcript(call.id)).transcript);
      markDone("calls");
    } catch (failure) {
      setError(messageOf(failure));
    }
  };

  if (error) {
    return (
      <EmptyState
        icon={<Phone className="h-5 w-5" />}
        title="Your recorded calls, next to your customers"
        detail="Connect Gong and every call's transcript shows up here, next to the customer it was with."
        action={
          <Link to={`/integrations/${CALL_PLATFORM}`} className="button-primary">
            Connect Gong
          </Link>
        }
      />
    );
  }
  if (!calls) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Calls</h1>
        <p className="page-subtitle flex items-center gap-2">
          <PlatformLogo platform={CALL_PLATFORM} label="Gong" size="small" /> Recorded in Gong
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <section className="panel h-fit overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {calls.map((call) => (
              <li key={call.id}>
                <button
                  type="button"
                  onClick={() => void open(call)}
                  className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition ${selected?.id === call.id ? "bg-brand/[0.06]" : "hover:bg-slate-50"}`}
                >
                  <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Phone className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{call.title}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                      {new Date(call.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {Math.round(call.durationSeconds / 60)} min
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel min-h-[420px] p-6">
          {!selected && (
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center text-slate-500">
              <Phone className="h-6 w-6 text-slate-300" />
              <p className="mt-3">Pick a call to read its transcript.</p>
            </div>
          )}
          {selected && (
            <>
              <h2 className="section-title">{selected.title}</h2>
              <p className="text-xs text-slate-500">{Math.round(selected.durationSeconds / 60)} minutes</p>
              {!transcript ? (
                <div className="mt-6 space-y-3">
                  <Skeleton className="h-12 w-2/3" />
                  <Skeleton className="ml-auto h-12 w-1/2" />
                  <Skeleton className="h-12 w-3/5" />
                </div>
              ) : (
                <ul className="mt-6 space-y-4">
                  {transcript.map((part, index) => {
                    const customer = isCustomer(part);
                    const speaker = part.speakerName ?? part.speakerId;
                    return (
                      <li key={`${part.speakerId}-${index}`} className={`flex gap-3 ${customer ? "" : "flex-row-reverse"}`}>
                        <Avatar name={speaker} size="small" />
                        <div className={`max-w-[75%] ${customer ? "" : "text-right"}`}>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{speaker}</p>
                          {part.sentences.map((sentence) => (
                            <p
                              key={sentence.start}
                              className={`mt-1 inline-block rounded-2xl px-4 py-2 text-left ${customer ? "rounded-tl-sm bg-slate-100 text-slate-800" : "rounded-tr-sm bg-brand text-white"}`}
                            >
                              {sentence.text}
                            </p>
                          ))}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export { CallsPage };
