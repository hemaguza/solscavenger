package app.solscavenger.dto;

public record SendTxResponse(
        String txSignature,
        String status
) {}

