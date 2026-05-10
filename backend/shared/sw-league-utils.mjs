import fs from "node:fs/promises";
import path from "node:path";

export async function readJson(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

export async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function getProjectPath(...segments) {
  return path.join(process.cwd(), ...segments);
}

export function percentage(value) {
  return Number(value.toFixed(3));
}
