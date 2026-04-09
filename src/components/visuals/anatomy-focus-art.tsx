import { useId } from "react";

import { cn } from "@/lib/utils";
import type { TrainingFocusKey } from "@/lib/training-visuals";

type AnatomyFocusArtProps = {
  focus?: TrainingFocusKey;
  frame?: "focus" | "full";
  className?: string;
  title?: string;
};

const focusViewBoxes: Record<NonNullable<AnatomyFocusArtProps["frame"]>, Record<TrainingFocusKey, string>> = {
  focus: {
    general: "70 40 620 900",
    chest: "120 90 520 680",
    back: "110 90 540 700",
    shoulders: "100 72 560 660",
    arms: "40 80 680 760",
    legs: "110 320 540 720",
    running: "90 280 580 760",
  },
  full: {
    general: "0 0 760 1100",
    chest: "0 0 760 1100",
    back: "0 0 760 1100",
    shoulders: "0 0 760 1100",
    arms: "0 0 760 1100",
    legs: "0 0 760 1100",
    running: "0 0 760 1100",
  },
};

function renderHighlight(focus: TrainingFocusKey, prefix: string) {
  const fill = `url(#${prefix}-focus)`;
  const stroke = `url(#${prefix}-focus-stroke)`;
  const props = {
    fill,
    stroke,
    strokeWidth: 4,
    filter: `url(#${prefix}-glow)`,
  };

  switch (focus) {
    case "chest":
      return (
        <g opacity="0.92">
          <ellipse {...props} cx="312" cy="394" rx="82" ry="62" transform="rotate(-14 312 394)" />
          <ellipse {...props} cx="448" cy="394" rx="82" ry="62" transform="rotate(14 448 394)" />
          <path {...props} d="M322 470c18-16 98-18 116 0v34H322z" opacity="0.65" />
        </g>
      );
    case "back":
      return (
        <g opacity="0.9">
          <path {...props} d="M258 308c-52 28-84 86-88 158 42 26 92 36 134 18 22-42 34-112 22-176-22-14-42-14-68 0z" />
          <path {...props} d="M502 308c52 28 84 86 88 158-42 26-92 36-134 18-22-42-34-112-22-176 22-14 42-14 68 0z" />
          <path {...props} d="M336 258c20-26 68-28 88 0l24 70H312z" opacity="0.68" />
        </g>
      );
    case "shoulders":
      return (
        <g opacity="0.94">
          <ellipse {...props} cx="236" cy="310" rx="96" ry="78" transform="rotate(-26 236 310)" />
          <ellipse {...props} cx="524" cy="310" rx="96" ry="78" transform="rotate(26 524 310)" />
        </g>
      );
    case "arms":
      return (
        <g opacity="0.92">
          <ellipse {...props} cx="186" cy="462" rx="58" ry="146" transform="rotate(10 186 462)" />
          <ellipse {...props} cx="574" cy="462" rx="58" ry="146" transform="rotate(-10 574 462)" />
          <ellipse {...props} cx="154" cy="664" rx="40" ry="126" transform="rotate(8 154 664)" opacity="0.84" />
          <ellipse {...props} cx="606" cy="664" rx="40" ry="126" transform="rotate(-8 606 664)" opacity="0.84" />
        </g>
      );
    case "legs":
      return (
        <g opacity="0.92">
          <ellipse {...props} cx="322" cy="794" rx="70" ry="188" transform="rotate(8 322 794)" />
          <ellipse {...props} cx="438" cy="794" rx="70" ry="188" transform="rotate(-8 438 794)" />
          <ellipse {...props} cx="332" cy="1010" rx="48" ry="126" transform="rotate(6 332 1010)" opacity="0.84" />
          <ellipse {...props} cx="428" cy="1010" rx="48" ry="126" transform="rotate(-6 428 1010)" opacity="0.84" />
        </g>
      );
    case "running":
      return (
        <g opacity="0.94">
          <ellipse {...props} cx="322" cy="794" rx="70" ry="188" transform="rotate(8 322 794)" />
          <ellipse {...props} cx="438" cy="794" rx="70" ry="188" transform="rotate(-8 438 794)" />
          <ellipse {...props} cx="332" cy="1010" rx="48" ry="126" transform="rotate(6 332 1010)" opacity="0.84" />
          <ellipse {...props} cx="428" cy="1010" rx="48" ry="126" transform="rotate(-6 428 1010)" opacity="0.84" />
          <path
            d="M112 782c62-52 112-74 164-96"
            fill="none"
            stroke={`url(#${prefix}-trail-cyan)`}
            strokeLinecap="round"
            strokeWidth="14"
            opacity="0.72"
          />
          <path
            d="M486 704c64 16 112 44 156 94"
            fill="none"
            stroke={`url(#${prefix}-trail-violet)`}
            strokeLinecap="round"
            strokeWidth="12"
            opacity="0.58"
          />
        </g>
      );
    case "general":
    default:
      return (
        <g opacity="0.84">
          <ellipse {...props} cx="236" cy="310" rx="92" ry="74" transform="rotate(-26 236 310)" />
          <ellipse {...props} cx="524" cy="310" rx="92" ry="74" transform="rotate(26 524 310)" />
          <ellipse {...props} cx="312" cy="394" rx="78" ry="58" transform="rotate(-14 312 394)" />
          <ellipse {...props} cx="448" cy="394" rx="78" ry="58" transform="rotate(14 448 394)" />
          <ellipse {...props} cx="380" cy="530" rx="74" ry="112" opacity="0.64" />
        </g>
      );
  }
}

export function AnatomyFocusArt(props: AnatomyFocusArtProps) {
  const focus = props.focus ?? "general";
  const frame = props.frame ?? "focus";
  const id = useId().replace(/:/g, "");
  const viewBox = focusViewBoxes[frame][focus];

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid slice"
      className={cn("anatomy-focus-art", props.className)}
      role={props.title ? "img" : undefined}
      aria-hidden={props.title ? undefined : true}
      aria-label={props.title}
    >
      <defs>
        <linearGradient id={`${id}-body`} x1="220" y1="90" x2="560" y2="1080" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d7a680" />
          <stop offset="0.34" stopColor="#b2785d" />
          <stop offset="0.72" stopColor="#8b5842" />
          <stop offset="1" stopColor="#64382d" />
        </linearGradient>
        <linearGradient id={`${id}-shadow`} x1="160" y1="160" x2="640" y2="1080" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255,255,255,0.16)" />
          <stop offset="0.36" stopColor="rgba(255,255,255,0.02)" />
          <stop offset="1" stopColor="rgba(0,0,0,0.36)" />
        </linearGradient>
        <linearGradient id={`${id}-muscle`} x1="250" y1="240" x2="510" y2="820" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9d5f52" stopOpacity="0.92" />
          <stop offset="1" stopColor="#69362f" stopOpacity="0.78" />
        </linearGradient>
        <linearGradient id={`${id}-focus`} x1="184" y1="232" x2="590" y2="1024" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e8ff9d" />
          <stop offset="0.34" stopColor="#c8ff62" />
          <stop offset="1" stopColor="#7dbf34" />
        </linearGradient>
        <linearGradient id={`${id}-focus-stroke`} x1="210" y1="258" x2="588" y2="988" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255,255,255,0.72)" />
          <stop offset="1" stopColor="rgba(206,255,112,0.86)" />
        </linearGradient>
        <linearGradient id={`${id}-line`} x1="220" y1="270" x2="560" y2="918" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(214,255,118,0.7)" />
          <stop offset="1" stopColor="rgba(190,255,138,0.28)" />
        </linearGradient>
        <linearGradient id={`${id}-trail-cyan`} x1="96" y1="760" x2="292" y2="710" gradientUnits="userSpaceOnUse">
          <stop stopColor="#33d6ff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#33d6ff" />
        </linearGradient>
        <linearGradient id={`${id}-trail-violet`} x1="490" y1="704" x2="658" y2="820" gradientUnits="userSpaceOnUse">
          <stop stopColor="#b36dff" />
          <stop offset="1" stopColor="#7f46ff" stopOpacity="0.22" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="14" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0.15  0 0 1 0 0  0 0 0 1 0"
            result="tint"
          />
          <feBlend in="SourceGraphic" in2="tint" mode="screen" />
        </filter>
      </defs>

      <g opacity="0.18">
        <circle cx="182" cy="198" r="114" fill="#7f46ff" />
        <circle cx="584" cy="186" r="92" fill="#b7f542" />
      </g>

      <g>
        <ellipse cx="380" cy="128" rx="88" ry="96" fill={`url(#${id}-body)`} />
        <path
          d="M322 206c-22 38-28 92-18 142 18 92 76 188 76 188s58-96 76-188c10-50 4-104-18-142-16-24-46-36-58-36-12 0-42 12-58 36z"
          fill={`url(#${id}-body)`}
        />
        <ellipse cx="380" cy="410" rx="152" ry="198" fill={`url(#${id}-body)`} />
        <ellipse cx="380" cy="642" rx="122" ry="118" fill={`url(#${id}-body)`} />
        <ellipse cx="224" cy="360" rx="102" ry="76" transform="rotate(-22 224 360)" fill={`url(#${id}-body)`} />
        <ellipse cx="536" cy="360" rx="102" ry="76" transform="rotate(22 536 360)" fill={`url(#${id}-body)`} />
        <ellipse cx="186" cy="484" rx="58" ry="164" transform="rotate(11 186 484)" fill={`url(#${id}-body)`} />
        <ellipse cx="574" cy="484" rx="58" ry="164" transform="rotate(-11 574 484)" fill={`url(#${id}-body)`} />
        <ellipse cx="154" cy="684" rx="38" ry="138" transform="rotate(8 154 684)" fill={`url(#${id}-body)`} />
        <ellipse cx="606" cy="684" rx="38" ry="138" transform="rotate(-8 606 684)" fill={`url(#${id}-body)`} />
        <ellipse cx="324" cy="824" rx="74" ry="212" transform="rotate(8 324 824)" fill={`url(#${id}-body)`} />
        <ellipse cx="436" cy="824" rx="74" ry="212" transform="rotate(-8 436 824)" fill={`url(#${id}-body)`} />
        <ellipse cx="334" cy="1048" rx="48" ry="132" transform="rotate(6 334 1048)" fill={`url(#${id}-body)`} />
        <ellipse cx="426" cy="1048" rx="48" ry="132" transform="rotate(-6 426 1048)" fill={`url(#${id}-body)`} />
        <ellipse cx="312" cy="394" rx="82" ry="62" transform="rotate(-14 312 394)" fill={`url(#${id}-muscle)`} opacity="0.5" />
        <ellipse cx="448" cy="394" rx="82" ry="62" transform="rotate(14 448 394)" fill={`url(#${id}-muscle)`} opacity="0.5" />
        <ellipse cx="380" cy="508" rx="84" ry="132" fill={`url(#${id}-muscle)`} opacity="0.35" />
        <ellipse cx="380" cy="408" rx="248" ry="420" fill={`url(#${id}-shadow)`} opacity="0.18" />
      </g>

      {renderHighlight(focus, id)}

      <g fill="#f0ffbf" opacity="0.82">
        <circle cx="380" cy="246" r="11" />
        <circle cx="276" cy="406" r="11" />
        <circle cx="484" cy="406" r="11" />
        <circle cx="380" cy="532" r="11" />
        <circle cx="332" cy="716" r="11" />
        <circle cx="428" cy="716" r="11" />
      </g>

      <g
        fill="none"
        stroke={`url(#${id}-line)`}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
        opacity="0.48"
      >
        <path d="M380 246 276 406 380 532 332 716" />
        <path d="M380 246 484 406 380 532 428 716" />
        <path d="M276 406 484 406" />
      </g>
    </svg>
  );
}
