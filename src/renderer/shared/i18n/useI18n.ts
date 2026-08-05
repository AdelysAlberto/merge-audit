import esDict from "./es.json";

type Dictionary = typeof esDict;

export const t = (keyPath: string): string => {
  const keys = keyPath.split(".");
  let current: any = esDict;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return keyPath;
    }
  }

  return typeof current === "string" ? current : keyPath;
};
