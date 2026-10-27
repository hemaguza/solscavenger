package app.solscavenger.dto;

import java.math.BigDecimal;

public record DormantAccountDto(
    String pubkey,
    String mint,
    BigDecimal balance,
    int decimals,
    long reclaimableLamports,
    BigDecimal reclaimableSol,
    String programId,
    String actionType // "CLOSE" or "WITHDRAW_EXCESS"
) {
    public DormantAccountDto(
            String pubkey,
            String mint,
            BigDecimal balance,
            int decimals,
            long reclaimableLamports,
            BigDecimal reclaimableSol,
            String programId
    ) {
        this(pubkey, mint, balance, decimals, reclaimableLamports, reclaimableSol, programId, "CLOSE");
    }
}
