package app.solscavenger.dto;

import java.time.Instant;

public record TreasuryConfigDto(
        String treasuryWallet,
        Double feePercentage,
        String solanaNetwork,
        String rpcUrl,
        Instant updatedAt,
        Instant lastUpdatedAt
) {
    public TreasuryConfigDto(String treasuryWallet, Double feePercentage, String solanaNetwork, String rpcUrl, Instant updatedAt) {
        this(treasuryWallet, feePercentage, solanaNetwork, rpcUrl, updatedAt, updatedAt);
    }
}
