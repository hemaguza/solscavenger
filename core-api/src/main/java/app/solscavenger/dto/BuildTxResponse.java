package app.solscavenger.dto;

import java.math.BigDecimal;
import java.util.List;

public record BuildTxResponse(
        List<String> transactionsBase64,
        int totalAccounts,
        BigDecimal totalSolRecovered,
        BigDecimal platformFeeSol,
        BigDecimal userNetRefundSol
) {}

