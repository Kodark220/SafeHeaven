import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createPublicClient, createWalletClient, defineChain, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const artifactPath = path.join(rootDir, "contracts", "artifacts", "ArcEscrow.json");
const deploymentDir = path.join(rootDir, "contracts", "deployments");
const deploymentPath = path.join(deploymentDir, "arc-testnet.json");

dotenv.config({ path: path.join(rootDir, ".env") });

const rpcUrl = process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network";
const chainId = Number(process.env.ARC_CHAIN_ID ?? 5042002);
const privateKey = process.env.ARC_RELAYER_PRIVATE_KEY;
const gasLimit = BigInt(process.env.ARC_DEPLOY_GAS_LIMIT ?? "4000000");

if (!privateKey) {
  console.error("ARC_RELAYER_PRIVATE_KEY is required to deploy ArcEscrow.");
  process.exit(1);
}

const artifact = JSON.parse(await fs.readFile(artifactPath, "utf8"));
if (!artifact?.abi || !artifact?.bytecode) {
  console.error("Build artifact missing ABI or bytecode. Run npm run contracts:build first.");
  process.exit(1);
}

const chain = defineChain({
  id: chainId,
  name: "Arc Testnet",
  network: "arc-testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: [rpcUrl]
    }
  },
  blockExplorers: {
    default: {
      name: "Arcscan",
      url: "https://testnet.arcscan.app"
    }
  },
  testnet: true
});

const account = privateKeyToAccount(privateKey);
const walletClient = createWalletClient({ account, chain, transport: http(rpcUrl) });
const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });

const balance = await publicClient.getBalance({ address: account.address });
if (balance === 0n) {
  console.error(`Relayer ${account.address} has zero balance on Arc testnet.`);
  process.exit(1);
}

console.log(`Deploying ArcEscrow from ${account.address}`);
const hash = await walletClient.deployContract({
  abi: artifact.abi,
  bytecode: artifact.bytecode,
  account,
  chain,
  gas: gasLimit
});

console.log(`Deployment tx: ${hash}`);
const receipt = await publicClient.waitForTransactionReceipt({ hash });
const contractAddress = receipt.contractAddress;

if (!contractAddress) {
  console.error("Deployment receipt did not contain a contract address.");
  process.exit(1);
}

await fs.mkdir(deploymentDir, { recursive: true });
await fs.writeFile(
  deploymentPath,
  JSON.stringify(
    {
      network: chain.name,
      chainId,
      contractName: "ArcEscrow",
      contractAddress,
      deployer: account.address,
      deploymentTxHash: hash,
      blockNumber: receipt.blockNumber.toString(),
      deployedAt: new Date().toISOString(),
      rpcUrl
    },
    null,
    2
  )
);

console.log(`ArcEscrow deployed at ${contractAddress}`);
console.log(`Saved deployment metadata to ${deploymentPath}`);
