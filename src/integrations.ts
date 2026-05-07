export function getIntegrationStatus() {
  return {
    genlayer: {
      configured: Boolean(process.env.GENLAYER_RPC_URL && process.env.GENLAYER_VERIFIER_CONTRACT_ADDRESS),
      network: process.env.GENLAYER_NETWORK ?? "testnetBradbury",
      contractAddress: process.env.GENLAYER_VERIFIER_CONTRACT_ADDRESS ?? null
    },
    arc: {
      rpcUrl: process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network",
      escrowContractAddress: process.env.ARC_ESCROW_CONTRACT_ADDRESS ?? null,
      relayerConfigured: Boolean(process.env.ARC_RELAYER_PRIVATE_KEY)
    },
    nanopayments: {
      configured: Boolean(process.env.NANOPAYMENTS_SELLER_ADDRESS),
      sellerAddress: process.env.NANOPAYMENTS_SELLER_ADDRESS ?? null,
      networks: (process.env.NANOPAYMENTS_NETWORKS ?? "eip155:5042002")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      facilitatorUrl: process.env.NANOPAYMENTS_FACILITATOR_URL ?? "https://gateway-api-testnet.circle.com"
    }
  };
}
