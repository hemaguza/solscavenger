package app.solscavenger.dto;

public record UpdateTreasuryConfigRequest(
        String treasuryWallet,
        Double feePercentage,
        String solanaNetwork,
        String rpcUrl
) {}

