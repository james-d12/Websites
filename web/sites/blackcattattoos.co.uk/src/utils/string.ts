export function capitalizeWords(str: string): string {
  return str
    .split(/\s+/) // split by whitespace
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ""))
    .join(" ");
}
