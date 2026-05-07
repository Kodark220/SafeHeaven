import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import solc from "solc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const sourcePath = path.join(rootDir, "contracts", "src", "ArcEscrow.sol");
const artifactDir = path.join(rootDir, "contracts", "artifacts");
const artifactPath = path.join(artifactDir, "ArcEscrow.json");

const source = await fs.readFile(sourcePath, "utf8");

const input = {
  language: "Solidity",
  sources: {
    "ArcEscrow.sol": { content: source }
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"]
      }
    }
  }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = output.errors ?? [];
const fatalErrors = errors.filter((entry) => entry.severity === "error");

for (const entry of errors) {
  const line = `${entry.severity.toUpperCase()}: ${entry.formattedMessage}`;
  if (entry.severity === "error") {
    console.error(line);
  } else {
    console.warn(line);
  }
}

if (fatalErrors.length > 0) {
  process.exit(1);
}

const contractOutput = output.contracts?.["ArcEscrow.sol"]?.ArcEscrow;
if (!contractOutput?.abi || !contractOutput?.evm?.bytecode?.object) {
  console.error("ArcEscrow compile output missing ABI or bytecode.");
  process.exit(1);
}

await fs.mkdir(artifactDir, { recursive: true });
await fs.writeFile(
  artifactPath,
  JSON.stringify(
    {
      contractName: "ArcEscrow",
      abi: contractOutput.abi,
      bytecode: `0x${contractOutput.evm.bytecode.object}`
    },
    null,
    2
  )
);

console.log(`Wrote artifact to ${artifactPath}`);
