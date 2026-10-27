package app.solscavenger.dto;

import java.util.List;

public record BuildTxRequest(
        String walletAddress,
        List<DormantAccountDto> accounts
) {}

