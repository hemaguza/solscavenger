package app.solscavenger.dto;

public record SendTxRequest(
        String base64Transaction,
        String walletAddress
) {}

