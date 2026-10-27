package app.solscavenger.security;

import io.vertx.core.http.HttpServerRequest;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import jakarta.ws.rs.ext.Provider;

@Provider
@Priority(Priorities.AUTHENTICATION - 10) // Executes before authentication
public class RateLimitFilter implements ContainerRequestFilter {

    @Inject
    RateLimiterService rateLimiterService;

    @Context
    HttpServerRequest httpRequest;

    @Override
    public void filter(ContainerRequestContext requestContext) {
        String path = requestContext.getUriInfo().getPath();

        // 1. Rate limit for Nonce issuance (anti-spam by IP)
        if (path.contains("/api/v1/auth/nonce")) {
            String clientIp = resolveClientIp(requestContext);
            if (!rateLimiterService.isAllowed("nonce", clientIp)) {
                abortWithTooManyRequests(requestContext, "Rate limit exceeded for nonce generation. Try again in 1 minute.");
            }
            return;
        }

        // 2. Rate limit for Solana Scanning (anti-DDoS on RPC nodes)
        if (path.contains("/api/v1/solana/scan")) {
            String clientIp = resolveClientIp(requestContext);
            if (!rateLimiterService.isAllowed("scan", clientIp)) {
                abortWithTooManyRequests(requestContext, "Rate limit exceeded for wallet scans. Max 5 scans per minute.");
            }
            return;
        }

        // 3. Rate limit for Reclaim execution
        if (path.contains("/api/v1/solana/record-reclaim")) {
            String clientIp = resolveClientIp(requestContext);
            if (!rateLimiterService.isAllowed("reclaim", clientIp)) {
                abortWithTooManyRequests(requestContext, "Rate limit exceeded for transaction submissions.");
            }
            return;
        }

        // 4. Rate limit for Solana Transaction Relay (send-tx)
        if (path.contains("/api/v1/solana/send-tx")) {
            String clientIp = resolveClientIp(requestContext);
            if (!rateLimiterService.isAllowed("send-tx", clientIp)) {
                abortWithTooManyRequests(requestContext, "Rate limit exceeded for transaction relay. Max 5 per minute.");
            }
        }
    }

    private String resolveClientIp(ContainerRequestContext context) {
        // Check Cloudflare header first, then standard forwarded headers
        String cfIp = context.getHeaderString("CF-Connecting-IP");
        if (cfIp != null && !cfIp.isBlank()) {
            return cfIp.trim();
        }

        String xForwarded = context.getHeaderString("X-Forwarded-For");
        if (xForwarded != null && !xForwarded.isBlank()) {
            return xForwarded.split(",")[0].trim();
        }

        if (httpRequest != null && httpRequest.remoteAddress() != null) {
            return httpRequest.remoteAddress().host();
        }

        return "unknown";
    }

    private void abortWithTooManyRequests(ContainerRequestContext context, String message) {
        String jsonError = String.format("{\"error\":\"Too Many Requests\",\"message\":\"%s\"}", message);
        context.abortWith(
                Response.status(429)
                        .type(MediaType.APPLICATION_JSON)
                        .header("Retry-After", "60")
                        .entity(jsonError)
                        .build()
        );
    }
}
