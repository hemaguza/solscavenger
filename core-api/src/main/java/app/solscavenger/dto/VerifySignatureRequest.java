package app.solscavenger.dto;

public record VerifySignatureRequest(
    String walletAddress,
    String nonce,
    String signature
) {}
