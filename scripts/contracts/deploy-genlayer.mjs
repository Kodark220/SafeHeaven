import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createAccount, createClient, chains } from "genlayer-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const artifactPath = path.join(rootDir, "contracts", "artifacts", "SubmissionVerifier.genlayer.zip");
const deploymentDir = path.join(rootDir, "contracts", "deployments");
const deploymentPath = path.join(deploymentDir, "genlayer.json");

dotenv.config({ path: path.join(rootDir, ".env") });

const rpcUrl = process.env.GENLAYER_RPC_URL ?? "";
const privateKey = process.env.GENLAYER_PRIVATE_KEY;
const network = (process.env.GENLAYER_NETWORK ?? "localnet").toLowerCase();

if (!rpcUrl) {
  console.error("GENLAYER_RPC_URL is required to deploy the GenLayer verifier package.");
  process.exit(1);
}

if (!privateKey) {
  console.error("GENLAYER_PRIVATE_KEY is required to deploy the GenLayer verifier package.");
  process.exit(1);
}

let chain;
if (network === "localnet") {
  chain = chains.localnet;
} else if (network === "simulator") {
  chain = chains.simulator;
} else {
  console.error(`GENLAYER_NETWORK=${network} is not supported by the installed genlayer-js version for automated deployment.`);
  console.error(`The package artifact is ready at ${artifactPath}. Use that artifact with your target GenLayer deployment flow.`);
  process.exit(1);
}

const code = new Uint8Array(await fs.readFile(artifactPath));
const account = createAccount(privateKey);
const client = createClient({ chain, endpoint: rpcUrl, account });

await client.initializeConsensusSmartContract(true);

console.log(`Deploying SubmissionVerifier from ${account.address} to ${network}`);
const hash = await client.deployContract({ code, account });
const receipt = await client.waitForTransactionReceipt({ hash });

await fs.mkdir(deploymentDir, { recursive: true });
await fs.writeFile(
  deploymentPath,
  JSON.stringify(
    {
      network,
      rpcUrl,
      contractName: "SubmissionVerifier",
      deploymentTxHash: hash,
      deployer: account.address,
      receipt,
      deployedAt: new Date().toISOString()
    },
    null,
    2
  )
);

console.log(`GenLayer deployment submitted with tx ${hash}`);
console.log(`Saved deployment metadata to ${deploymentPath}`);
