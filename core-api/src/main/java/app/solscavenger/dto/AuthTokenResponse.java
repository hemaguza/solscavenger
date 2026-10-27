package app.solscavenger.dto;

public record AuthTokenResponse(
    String token,
    String tokenType,
    long expiresInSeconds,
    String walletAddress
) {}
