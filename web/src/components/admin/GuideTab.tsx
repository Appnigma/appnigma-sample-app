import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { api, messageOf } from "../../api/client";
import { Notice } from "../Notice";
import { Skeleton } from "../Skeleton";

const GUIDE_FILE_NAME = "integrations-guide.md";

// The guide for your developers, written for your company from what is live.
const GuideTab = () => {
  const [guide, setGuide] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setGuide((await api.guide()).guide);
      } catch (failure) {
        setError(messageOf(failure));
      }
    })();
  }, []);

  const download = () => {
    if (!guide) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([guide], { type: "text/markdown" }));
    link.download = GUIDE_FILE_NAME;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (error) return <Notice tone="bad">{error}</Notice>;
  if (!guide) return <Skeleton className="h-72" />;
  return (
    <div className="space-y-3">
      <button type="button" onClick={download} className="button-secondary">
        <Download className="h-4 w-4" /> Download as Markdown
      </button>
      <pre className="panel max-h-[70vh] overflow-auto whitespace-pre-wrap p-5 font-mono text-xs leading-5 text-slate-700">{guide}</pre>
    </div>
  );
};

export { GuideTab };
