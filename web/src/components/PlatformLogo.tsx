import { useState } from "react";
import { infoOf, initialsOf, logoUrlOf } from "../lib/platforms";

const SIZES = {
  small: { box: "h-8 w-8", image: "h-5 w-5", text: "text-[11px]" },
  medium: { box: "h-11 w-11", image: "h-7 w-7", text: "text-xs" },
  large: { box: "h-14 w-14", image: "h-9 w-9", text: "text-base" },
};

// The platform's own logo on a white tile, or its initials in its colour when the logo cannot load.
const PlatformLogo = ({ platform, label, size = "medium" }: { platform: string; label: string; size?: keyof typeof SIZES }) => {
  const [failed, setFailed] = useState(false);
  const info = infoOf(platform);
  const url = logoUrlOf(info.domain);
  const classes = SIZES[size];
  if (!url || failed) {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center rounded-xl font-bold text-white ${classes.box} ${classes.text}`} style={{ backgroundColor: info.color }}>
        {initialsOf(label)}
      </span>
    );
  }
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm ${classes.box}`}>
      <img src={url} alt="" className={`${classes.image} object-contain`} onError={() => setFailed(true)} />
    </span>
  );
};

export { PlatformLogo };
