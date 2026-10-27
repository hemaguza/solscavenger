package app.solscavenger.dto;

import java.time.Instant;

public record AuthNonceResponse(
    String nonce,
    String statement,
    Instant issuedAt,
    Instant expiresAt
) {}
