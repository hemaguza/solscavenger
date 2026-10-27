package app.solscavenger.security;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

@QuarkusTest
public class RateLimiterServiceTest {

    @Inject
    RateLimiterService rateLimiterService;

    @Test
    public void testRateLimitingEnforcement() {
        String testIp = "10.0.0.1";

        // Nonce limit is 10 per minute
        for (int i = 0; i < 10; i++) {
            boolean allowed = rateLimiterService.isAllowed("nonce", testIp);
            Assertions.assertTrue(allowed, "Request " + (i + 1) + " should be allowed");
        }

        // 11th request should be blocked
        boolean eleventhAllowed = rateLimiterService.isAllowed("nonce", testIp);
        Assertions.assertFalse(eleventhAllowed, "11th request must be blocked by rate limiter");

        // A different IP should still be allowed
        String otherIp = "10.0.0.2";
        boolean otherAllowed = rateLimiterService.isAllowed("nonce", otherIp);
        Assertions.assertTrue(otherAllowed, "Different IP should have its own rate quota");
    }
}
