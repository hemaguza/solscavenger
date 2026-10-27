package app.solscavenger.dto;

import java.math.BigDecimal;
import java.util.List;

public record ScanResponse(
    String walletAddress,
    int totalAccountsFound,
    BigDecimal totalSolRecovered,
    BigDecimal userNetRefundSol,
    BigDecimal platformFeeSol,
    BigDecimal estimatedUsdValue,
    List<DormantAccountDto> accounts
) {}
