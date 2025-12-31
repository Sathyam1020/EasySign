import { FileItem, Theme } from "./types"

const themes: Theme[] = [
  { base: "#FFE066", blob: "#C9A227" },
  { base: "#C9F2FF", blob: "#7EC4E4" },
  { base: "#FFD9EC", blob: "#E88BB5" },
  { base: "#E8FFD3", blob: "#95C97A" },
  { base: "#FFF2CC", blob: "#E6B95C" }
]

let prevTheme: Theme | null = null

export const fileList: FileItem[] = [
  { name: "Sathyam's Documents", signed: false },
  { name: "John's Documents", signed: true }
].map(item => {
  let randomTheme = themes[Math.floor(Math.random() * themes.length)]

  while (prevTheme && randomTheme === prevTheme) {
    randomTheme = themes[Math.floor(Math.random() * themes.length)]
  }

  prevTheme = randomTheme

  return {
    ...item,
    theme: randomTheme
  }
}); 
