package app.solscavenger.dto;

import java.math.BigDecimal;

public record RecordReclaimRequest(
    String txSignature,
    String walletAddress,
    int accountsClosedCount,
    BigDecimal totalSolRecovered,
    BigDecimal userSolReceived,
    BigDecimal platformFeeSol,
    BigDecimal platformFeeUsd
) {}
