package app.solscavenger.dto;

import java.math.BigDecimal;

public record AdminMetricsSummaryResponse(
    BigDecimal totalSolRecovered,
    BigDecimal totalFeesCollectedSol,
    BigDecimal totalFeesCollectedUsd,
    long totalWalletsScanned,
    long totalReclaimsExecuted,
    double conversionRate
) {}
