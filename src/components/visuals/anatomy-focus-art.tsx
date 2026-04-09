import { useId } from "react";

import { cn } from "@/lib/utils";
import type { TrainingFocusKey } from "@/lib/training-visuals";

type AnatomyFocusArtProps = {
  focus?: TrainingFocusKey;
  frame?: "focus" | "full";
  className?: string;
  title?: string;
};

type FocusTheme = {
  accentFrom: string;
  accentTo: string;
  accentGlow: string;
  ambientLeft: string;
  ambientRight: string;
  trailA: string;
  trailB: string;
  label: string;
  pose: "front" | "back";
};

const focusThemes: Record<TrainingFocusKey, FocusTheme> = {
  general: {
    accentFrom: "#dfff91",
    accentTo: "#98db45",
    accentGlow: "#bbff68",
    ambientLeft: "#7f46ff",
    ambientRight: "#b7f542",
    trailA: "#9a64ff",
    trailB: "#cbff71",
    label: "General",
    pose: "front",
  },
  chest: {
    accentFrom: "#efff9f",
    accentTo: "#9fe24d",
    accentGlow: "#d8ff73",
    ambientLeft: "#8b5dff",
    ambientRight: "#baf84a",
    trailA: "#8d61ff",
    trailB: "#daff6a",
    label: "Pecho",
    pose: "front",
  },
  back: {
    accentFrom: "#d5ff92",
    accentTo: "#8ad53f",
    accentGlow: "#bffd67",
    ambientLeft: "#7246ff",
    ambientRight: "#89ff7a",
    trailA: "#64a6ff",
    trailB: "#c6ff69",
    label: "Espalda",
    pose: "back",
  },
  shoulders: {
    accentFrom: "#f0ff9c",
    accentTo: "#abeb51",
    accentGlow: "#d7ff69",
    ambientLeft: "#8a58ff",
    ambientRight: "#baf84a",
    trailA: "#9a64ff",
    trailB: "#d9ff78",
    label: "Hombros",
    pose: "front",
  },
  arms: {
    accentFrom: "#ecff9e",
    accentTo: "#8ede48",
    accentGlow: "#caff6c",
    ambientLeft: "#8e5bff",
    ambientRight: "#b6fb57",
    trailA: "#9f5fff",
    trailB: "#d8ff79",
    label: "Brazos",
    pose: "front",
  },
  legs: {
    accentFrom: "#deff96",
    accentTo: "#87da40",
    accentGlow: "#bffd67",
    ambientLeft: "#7e4bff",
    ambientRight: "#b5ff70",
    trailA: "#33d6ff",
    trailB: "#b9ff66",
    label: "Piernas",
    pose: "front",
  },
  running: {
    accentFrom: "#dfff8f",
    accentTo: "#7ed93a",
    accentGlow: "#bffd63",
    ambientLeft: "#4d8eff",
    ambientRight: "#c2ff5b",
    trailA: "#33d6ff",
    trailB: "#b36dff",
    label: "Running",
    pose: "front",
  },
};

const focusViewBoxes: Record<NonNullable<AnatomyFocusArtProps["frame"]>, Record<TrainingFocusKey, string>> = {
  focus: {
    general: "120 100 520 800",
    chest: "160 110 440 540",
    back: "160 110 440 540",
    shoulders: "120 84 520 500",
    arms: "60 150 640 690",
    legs: "165 460 430 610",
    running: "135 410 500 650",
  },
  full: {
    general: "40 48 680 1000",
    chest: "40 48 680 1000",
    back: "40 48 680 1000",
    shoulders: "40 48 680 1000",
    arms: "40 48 680 1000",
    legs: "40 48 680 1000",
    running: "40 48 680 1000",
  },
};

function renderFrontBody(id: string) {
  return (
    <g>
      <ellipse cx="380" cy="124" rx="86" ry="92" fill={`url(#${id}-skin)`} />
      <path
        d="M326 206c-20 38-24 86-10 138 18 70 64 146 64 146s46-76 64-146c14-52 10-100-10-138-16-22-44-34-54-34s-38 12-54 34z"
        fill={`url(#${id}-skin)`}
      />
      <ellipse cx="380" cy="398" rx="154" ry="196" fill={`url(#${id}-skin)`} />
      <ellipse cx="380" cy="632" rx="126" ry="126" fill={`url(#${id}-skin)`} />
      <ellipse cx="222" cy="360" rx="108" ry="82" transform="rotate(-22 222 360)" fill={`url(#${id}-skin)`} />
      <ellipse cx="538" cy="360" rx="108" ry="82" transform="rotate(22 538 360)" fill={`url(#${id}-skin)`} />
      <ellipse cx="186" cy="492" rx="60" ry="170" transform="rotate(10 186 492)" fill={`url(#${id}-skin)`} />
      <ellipse cx="574" cy="492" rx="60" ry="170" transform="rotate(-10 574 492)" fill={`url(#${id}-skin)`} />
      <ellipse cx="156" cy="706" rx="40" ry="136" transform="rotate(8 156 706)" fill={`url(#${id}-skin)`} />
      <ellipse cx="604" cy="706" rx="40" ry="136" transform="rotate(-8 604 706)" fill={`url(#${id}-skin)`} />
      <ellipse cx="326" cy="838" rx="78" ry="224" transform="rotate(8 326 838)" fill={`url(#${id}-skin)`} />
      <ellipse cx="434" cy="838" rx="78" ry="224" transform="rotate(-8 434 838)" fill={`url(#${id}-skin)`} />
      <ellipse cx="334" cy="1056" rx="48" ry="134" transform="rotate(6 334 1056)" fill={`url(#${id}-skin)`} />
      <ellipse cx="426" cy="1056" rx="48" ry="134" transform="rotate(-6 426 1056)" fill={`url(#${id}-skin)`} />

      <ellipse cx="312" cy="394" rx="84" ry="60" transform="rotate(-14 312 394)" fill={`url(#${id}-muscle)`} opacity="0.48" />
      <ellipse cx="448" cy="394" rx="84" ry="60" transform="rotate(14 448 394)" fill={`url(#${id}-muscle)`} opacity="0.48" />
      <ellipse cx="380" cy="514" rx="86" ry="136" fill={`url(#${id}-muscle)`} opacity="0.34" />
      <ellipse cx="380" cy="406" rx="256" ry="428" fill={`url(#${id}-shadow)`} opacity="0.2" />
    </g>
  );
}

function renderBackBody(id: string) {
  return (
    <g>
      <ellipse cx="380" cy="120" rx="86" ry="92" fill={`url(#${id}-skin)`} />
      <path
        d="M312 214c6 70 30 118 68 152 38-34 62-82 68-152-24-26-46-38-68-38s-44 12-68 38z"
        fill={`url(#${id}-skin)`}
      />
      <ellipse cx="380" cy="398" rx="158" ry="202" fill={`url(#${id}-skin)`} />
      <ellipse cx="380" cy="640" rx="126" ry="130" fill={`url(#${id}-skin)`} />
      <ellipse cx="220" cy="362" rx="112" ry="86" transform="rotate(-22 220 362)" fill={`url(#${id}-skin)`} />
      <ellipse cx="540" cy="362" rx="112" ry="86" transform="rotate(22 540 362)" fill={`url(#${id}-skin)`} />
      <ellipse cx="186" cy="492" rx="60" ry="170" transform="rotate(10 186 492)" fill={`url(#${id}-skin)`} />
      <ellipse cx="574" cy="492" rx="60" ry="170" transform="rotate(-10 574 492)" fill={`url(#${id}-skin)`} />
      <ellipse cx="156" cy="706" rx="40" ry="136" transform="rotate(8 156 706)" fill={`url(#${id}-skin)`} />
      <ellipse cx="604" cy="706" rx="40" ry="136" transform="rotate(-8 604 706)" fill={`url(#${id}-skin)`} />
      <ellipse cx="326" cy="838" rx="78" ry="224" transform="rotate(8 326 838)" fill={`url(#${id}-skin)`} />
      <ellipse cx="434" cy="838" rx="78" ry="224" transform="rotate(-8 434 838)" fill={`url(#${id}-skin)`} />
      <ellipse cx="334" cy="1056" rx="48" ry="134" transform="rotate(6 334 1056)" fill={`url(#${id}-skin)`} />
      <ellipse cx="426" cy="1056" rx="48" ry="134" transform="rotate(-6 426 1056)" fill={`url(#${id}-skin)`} />

      <path
        d="M278 290c-44 34-72 90-76 156 38 26 86 40 128 30 30-40 44-106 34-182-26-18-56-20-86-4z"
        fill={`url(#${id}-muscle)`}
        opacity="0.4"
      />
      <path
        d="M482 290c44 34 72 90 76 156-38 26-86 40-128 30-30-40-44-106-34-182 26-18 56-20 86-4z"
        fill={`url(#${id}-muscle)`}
        opacity="0.4"
      />
      <ellipse cx="380" cy="420" rx="72" ry="112" fill={`url(#${id}-muscle)`} opacity="0.26" />
      <ellipse cx="380" cy="406" rx="256" ry="428" fill={`url(#${id}-shadow)`} opacity="0.2" />
    </g>
  );
}

function renderFocusOverlay(focus: TrainingFocusKey, id: string) {
  const fill = `url(#${id}-focus)`;
  const stroke = `url(#${id}-focus-stroke)`;
  const shapeProps = {
    fill,
    stroke,
    strokeWidth: 4,
    filter: `url(#${id}-glow)`,
  };

  switch (focus) {
    case "chest":
      return (
        <g opacity="0.94">
          <ellipse {...shapeProps} cx="312" cy="394" rx="82" ry="62" transform="rotate(-14 312 394)" />
          <ellipse {...shapeProps} cx="448" cy="394" rx="82" ry="62" transform="rotate(14 448 394)" />
          <path {...shapeProps} d="M320 472c22-18 98-18 120 0v30H320z" opacity="0.7" />
        </g>
      );
    case "back":
      return (
        <g opacity="0.94">
          <path {...shapeProps} d="M276 296c-50 36-82 92-86 160 40 24 90 34 132 20 28-42 42-110 34-184-28-16-50-14-80 4z" />
          <path {...shapeProps} d="M484 296c50 36 82 92 86 160-40 24-90 34-132 20-28-42-42-110-34-184 28-16 50-14 80 4z" />
          <path {...shapeProps} d="M320 252c16-24 82-24 120 0l20 58H300z" opacity="0.72" />
        </g>
      );
    case "shoulders":
      return (
        <g opacity="0.96">
          <ellipse {...shapeProps} cx="230" cy="308" rx="100" ry="80" transform="rotate(-24 230 308)" />
          <ellipse {...shapeProps} cx="530" cy="308" rx="100" ry="80" transform="rotate(24 530 308)" />
          <path {...shapeProps} d="M270 258c30-18 190-18 220 0l-20 42H290z" opacity="0.55" />
        </g>
      );
    case "arms":
      return (
        <g opacity="0.94">
          <ellipse {...shapeProps} cx="188" cy="486" rx="54" ry="150" transform="rotate(10 188 486)" />
          <ellipse {...shapeProps} cx="572" cy="486" rx="54" ry="150" transform="rotate(-10 572 486)" />
          <ellipse {...shapeProps} cx="156" cy="706" rx="40" ry="124" transform="rotate(8 156 706)" opacity="0.82" />
          <ellipse {...shapeProps} cx="604" cy="706" rx="40" ry="124" transform="rotate(-8 604 706)" opacity="0.82" />
        </g>
      );
    case "legs":
      return (
        <g opacity="0.96">
          <ellipse {...shapeProps} cx="326" cy="840" rx="72" ry="210" transform="rotate(8 326 840)" />
          <ellipse {...shapeProps} cx="434" cy="840" rx="72" ry="210" transform="rotate(-8 434 840)" />
          <ellipse {...shapeProps} cx="334" cy="1056" rx="44" ry="122" transform="rotate(6 334 1056)" opacity="0.8" />
          <ellipse {...shapeProps} cx="426" cy="1056" rx="44" ry="122" transform="rotate(-6 426 1056)" opacity="0.8" />
        </g>
      );
    case "running":
      return (
        <g opacity="0.96">
          <ellipse {...shapeProps} cx="326" cy="840" rx="72" ry="210" transform="rotate(8 326 840)" />
          <ellipse {...shapeProps} cx="434" cy="840" rx="72" ry="210" transform="rotate(-8 434 840)" />
          <ellipse {...shapeProps} cx="334" cy="1056" rx="44" ry="122" transform="rotate(6 334 1056)" opacity="0.8" />
          <ellipse {...shapeProps} cx="426" cy="1056" rx="44" ry="122" transform="rotate(-6 426 1056)" opacity="0.8" />
          <path
            d="M108 790c76-58 120-80 194-110"
            fill="none"
            stroke={`url(#${id}-trail-a)`}
            strokeLinecap="round"
            strokeWidth="16"
            opacity="0.76"
          />
          <path
            d="M468 718c70 18 120 50 170 112"
            fill="none"
            stroke={`url(#${id}-trail-b)`}
            strokeLinecap="round"
            strokeWidth="14"
            opacity="0.66"
          />
        </g>
      );
    case "general":
    default:
      return (
        <g opacity="0.88">
          <ellipse {...shapeProps} cx="230" cy="308" rx="92" ry="76" transform="rotate(-24 230 308)" />
          <ellipse {...shapeProps} cx="530" cy="308" rx="92" ry="76" transform="rotate(24 530 308)" />
          <ellipse {...shapeProps} cx="312" cy="394" rx="78" ry="58" transform="rotate(-14 312 394)" />
          <ellipse {...shapeProps} cx="448" cy="394" rx="78" ry="58" transform="rotate(14 448 394)" />
          <ellipse {...shapeProps} cx="380" cy="520" rx="74" ry="118" opacity="0.65" />
        </g>
      );
  }
}

function renderNodes(id: string) {
  return (
    <>
      <g fill="#f5ffd6" opacity="0.86">
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
        opacity="0.54"
      >
        <path d="M380 246 276 406 380 532 332 716" />
        <path d="M380 246 484 406 380 532 428 716" />
        <path d="M276 406 484 406" />
      </g>
    </>
  );
}

export function AnatomyFocusArt(props: AnatomyFocusArtProps) {
  const focus = props.focus ?? "general";
  const frame = props.frame ?? "focus";
  const theme = focusThemes[focus];
  const id = useId().replace(/:/g, "");
  const viewBox = focusViewBoxes[frame][focus];

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio={frame === "full" ? "xMidYMid meet" : "xMidYMid slice"}
      className={cn("anatomy-focus-art", props.className)}
      role={props.title ? "img" : undefined}
      aria-hidden={props.title ? undefined : true}
      aria-label={props.title}
    >
      <defs>
        <linearGradient id={`${id}-skin`} x1="220" y1="90" x2="560" y2="1080" gradientUnits="userSpaceOnUse">
          <stop stopColor="#dbac86" />
          <stop offset="0.34" stopColor="#ba7c60" />
          <stop offset="0.72" stopColor="#8c5942" />
          <stop offset="1" stopColor="#60382e" />
        </linearGradient>
        <linearGradient id={`${id}-shadow`} x1="160" y1="160" x2="640" y2="1080" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255,255,255,0.18)" />
          <stop offset="0.34" stopColor="rgba(255,255,255,0.04)" />
          <stop offset="1" stopColor="rgba(0,0,0,0.44)" />
        </linearGradient>
        <linearGradient id={`${id}-muscle`} x1="250" y1="220" x2="520" y2="880" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a96656" stopOpacity="0.92" />
          <stop offset="1" stopColor="#6f3a31" stopOpacity="0.78" />
        </linearGradient>
        <linearGradient id={`${id}-focus`} x1="180" y1="210" x2="590" y2="1040" gradientUnits="userSpaceOnUse">
          <stop stopColor={theme.accentFrom} />
          <stop offset="0.38" stopColor={theme.accentGlow} />
          <stop offset="1" stopColor={theme.accentTo} />
        </linearGradient>
        <linearGradient id={`${id}-focus-stroke`} x1="200" y1="250" x2="600" y2="980" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255,255,255,0.72)" />
          <stop offset="1" stopColor={theme.accentGlow} />
        </linearGradient>
        <linearGradient id={`${id}-line`} x1="220" y1="250" x2="560" y2="920" gradientUnits="userSpaceOnUse">
          <stop stopColor={`${theme.accentGlow}cc`} />
          <stop offset="1" stopColor={`${theme.accentTo}3d`} />
        </linearGradient>
        <linearGradient id={`${id}-trail-a`} x1="96" y1="760" x2="292" y2="710" gradientUnits="userSpaceOnUse">
          <stop stopColor={`${theme.trailA}20`} />
          <stop offset="1" stopColor={theme.trailA} />
        </linearGradient>
        <linearGradient id={`${id}-trail-b`} x1="490" y1="704" x2="658" y2="820" gradientUnits="userSpaceOnUse">
          <stop stopColor={theme.trailB} />
          <stop offset="1" stopColor={`${theme.trailB}26`} />
        </linearGradient>
        <radialGradient id={`${id}-ambient-left`} cx="0" cy="0" r="1" gradientTransform="translate(180 188) rotate(90) scale(180)">
          <stop stopColor={`${theme.ambientLeft}66`} />
          <stop offset="1" stopColor={`${theme.ambientLeft}00`} />
        </radialGradient>
        <radialGradient id={`${id}-ambient-right`} cx="0" cy="0" r="1" gradientTransform="translate(580 204) rotate(90) scale(160)">
          <stop stopColor={`${theme.ambientRight}73`} />
          <stop offset="1" stopColor={`${theme.ambientRight}00`} />
        </radialGradient>
        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="16" result="blur" />
          <feBlend in="SourceGraphic" in2="blur" mode="screen" />
        </filter>
      </defs>

      <g opacity={frame === "full" ? "0.28" : "0.22"}>
        <circle cx="182" cy="198" r="126" fill={`url(#${id}-ambient-left)`} />
        <circle cx="584" cy="196" r="98" fill={`url(#${id}-ambient-right)`} />
      </g>

      <g opacity={frame === "full" ? "0.16" : "0.1"}>
        <path
          d="M92 868c86-74 188-118 294-132"
          fill="none"
          stroke={`url(#${id}-trail-a)`}
          strokeLinecap="round"
          strokeWidth="16"
        />
        <path
          d="M420 732c102 26 178 70 236 136"
          fill="none"
          stroke={`url(#${id}-trail-b)`}
          strokeLinecap="round"
          strokeWidth="12"
        />
      </g>

      {theme.pose === "back" ? renderBackBody(id) : renderFrontBody(id)}
      {renderFocusOverlay(focus, id)}
      {renderNodes(id)}
    </svg>
  );
}
