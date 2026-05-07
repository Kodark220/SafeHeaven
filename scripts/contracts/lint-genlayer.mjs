import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const contractDir = path.join(rootDir, "contracts", "genlayer");

function runPy(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("py", args, {
      cwd: contractDir,
      stdio: "inherit",
      shell: false
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Command failed: py ${args.join(" ")}`));
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

try {
  await runPy(["-m", "ruff", "check", "src"]);
  await runPy(["-m", "py_compile", "src/__init__.py"]);
} catch (error) {
  console.error("Failed to run GenLayer lint. Install dependencies with: py -m pip install -r contracts/genlayer/requirements-dev.txt");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
