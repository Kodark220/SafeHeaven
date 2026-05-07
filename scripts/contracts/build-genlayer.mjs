import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const contractDir = path.join(rootDir, "contracts", "genlayer");
const artifactDir = path.join(rootDir, "contracts", "artifacts");
const outputPath = path.join(artifactDir, "SubmissionVerifier.genlayer.zip");

const zip = new JSZip();
const files = [
  { source: path.join(contractDir, "src", "__init__.py"), target: "src/__init__.py" },
  { source: path.join(contractDir, "runner.json"), target: "runner.json" },
  { source: path.join(contractDir, "requirements.txt"), target: "requirements.txt" }
];

for (const file of files) {
  const content = await fs.readFile(file.source);
  zip.file(file.target, content);
}

const bundle = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 9 } });
await fs.mkdir(artifactDir, { recursive: true });
await fs.writeFile(outputPath, bundle);

console.log(`Wrote GenLayer package to ${outputPath}`);
