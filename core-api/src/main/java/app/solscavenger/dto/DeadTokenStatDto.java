package app.solscavenger.dto;

import java.math.BigDecimal;

public record DeadTokenStatDto(
        String mintAddress,
        String symbol,
        Long occurrences,
        BigDecimal totalSolReclaimed
) {}

