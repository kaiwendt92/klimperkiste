/**
 * Die 9 Kacheln des Soundboards.
 * Neue Sounds: MP3 nach public/sounds/ legen und hier einen Eintrag ergänzen.
 */
export interface Track {
  id: string;
  title: string;
  file: string;
  bg: string;
  fg: string;
  icon: IconName;
}

export type IconName =
  | "drop" | "sun" | "star" | "bell" | "flower" | "cloud" | "heart" | "moon" | "rainbow";

export const TRACKS: Track[] = [
  { id: "entchen",   title: "Alle meine Entchen",             file: "sounds/01-entchen.mp3",   bg: "#8FD3F4", fg: "#1E6FA8", icon: "drop" },
  { id: "haenschen", title: "Hänschen klein",                 file: "sounds/02-haenschen.mp3", bg: "#FFE07A", fg: "#F08A00", icon: "sun" },
  { id: "sternchen", title: "Morgen kommt der Weihnachtsmann", file: "sounds/03-sternchen.mp3", bg: "#2E3A87", fg: "#FFD84D", icon: "star" },
  { id: "jakob",     title: "Bruder Jakob",                   file: "sounds/04-jakob.mp3",     bg: "#FFB48A", fg: "#B83A0B", icon: "bell" },
  { id: "bauernhof", title: "Old MacDonald",                  file: "sounds/05-bauernhof.mp3", bg: "#A8E6A3", fg: "#E8508A", icon: "flower" },
  { id: "laemmchen", title: "Mary hat ein kleines Lamm",      file: "sounds/06-laemmchen.mp3", bg: "#B9A2EE", fg: "#FFFFFF", icon: "cloud" },
  { id: "freude",    title: "Ode an die Freude",              file: "sounds/07-freude.mp3",    bg: "#FFC2D4", fg: "#E11D48", icon: "heart" },
  { id: "gutenacht", title: "Guten Abend, gut' Nacht",        file: "sounds/08-gutenacht.mp3", bg: "#3B3F73", fg: "#FFF1A8", icon: "moon" },
  { id: "bruecke",   title: "London Bridge",                  file: "sounds/09-bruecke.mp3",   bg: "#CDEBFF", fg: "#E8508A", icon: "rainbow" },
];

/** Einfache, kontrastreiche Formen – gut erkennbar für Babys. */
export function iconSvg(name: IconName, fg: string): string {
  const shapes: Record<IconName, string> = {
    drop: `<path d="M50 10 C50 10 20 46 20 64 a30 30 0 0 0 60 0 C80 46 50 10 50 10Z" fill="${fg}"/>
           <ellipse cx="38" cy="62" rx="6" ry="10" fill="#fff" opacity=".55"/>`,
    sun: `<g stroke="${fg}" stroke-width="7" stroke-linecap="round">
            ${[0, 45, 90, 135, 180, 225, 270, 315].map(a =>
              `<line x1="50" y1="8" x2="50" y2="20" transform="rotate(${a} 50 50)"/>`).join("")}
          </g><circle cx="50" cy="50" r="24" fill="${fg}"/>`,
    star: `<path d="M50 8 L61.8 35.5 L91.5 38.2 L69 57.8 L75.7 87 L50 71.6 L24.3 87 L31 57.8 L8.5 38.2 L38.2 35.5Z"
             fill="${fg}" stroke="${fg}" stroke-width="5" stroke-linejoin="round"/>`,
    bell: `<path d="M50 14 c-17 0 -26 13 -26 30 v16 l-8 12 h68 l-8 -12 v-16 c0 -17 -9 -30 -26 -30Z" fill="${fg}"/>
           <circle cx="50" cy="80" r="8" fill="${fg}"/><circle cx="50" cy="11" r="5" fill="${fg}"/>`,
    flower: `${[0, 60, 120, 180, 240, 300].map(a =>
              `<circle cx="50" cy="26" r="16" fill="${fg}" transform="rotate(${a} 50 50)"/>`).join("")}
             <circle cx="50" cy="50" r="14" fill="#FFD84D"/>`,
    cloud: `<path d="M28 76 a18 18 0 0 1 -2 -36 a22 22 0 0 1 42 -6 a16 16 0 0 1 8 42Z" fill="${fg}"/>`,
    heart: `<path d="M50 86 C20 64 10 48 10 34 a20 20 0 0 1 40 -6 a20 20 0 0 1 40 6 c0 14 -10 30 -40 52Z" fill="${fg}"/>`,
    moon: `<path d="M64 12 a38 38 0 1 0 24 62 a30 30 0 1 1 -24 -62Z" fill="${fg}"/>`,
    rainbow: `<g fill="none" stroke-width="9" stroke-linecap="round">
               <path d="M12 74 a38 38 0 0 1 76 0" stroke="#F25C54"/>
               <path d="M22 74 a28 28 0 0 1 56 0" stroke="#F7B32B"/>
               <path d="M32 74 a18 18 0 0 1 36 0" stroke="#4CB944"/>
               <path d="M41 74 a9 9 0 0 1 18 0" stroke="#3E8EDE"/>
             </g>`,
  };
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${shapes[name]}</svg>`;
}
