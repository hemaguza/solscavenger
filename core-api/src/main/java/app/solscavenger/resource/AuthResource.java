package app.solscavenger.resource;

import app.solscavenger.dto.AuthNonceResponse;
import app.solscavenger.dto.AuthTokenResponse;
import app.solscavenger.dto.VerifySignatureRequest;
import app.solscavenger.service.CryptoService;
import app.solscavenger.service.JwtService;
import app.solscavenger.service.NonceService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/v1/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    NonceService nonceService;

    @Inject
    CryptoService cryptoService;

    @Inject
    JwtService jwtService;

    /**
     * Step 1: Issue temporary cryptographic nonce challenge for a wallet address.
     */
    @GET
    @Path("/nonce")
    public Response getNonce(@QueryParam("wallet") String wallet) {
        if (wallet == null || wallet.trim().isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Query param 'wallet' is required\"}")
                    .build();
        }

        NonceService.NonceRecord record = nonceService.createNonce(wallet.trim());
        AuthNonceResponse response = new AuthNonceResponse(
                record.nonce(),
                record.statement(),
                java.time.Instant.now(),
                record.expiresAt()
        );

        return Response.ok(response).build();
    }

    /**
     * Step 2: Verify Ed25519 signature of the nonce statement and emit JWT session.
     */
    @POST
    @Path("/verify")
    public Response verifySignature(VerifySignatureRequest request) {
        if (request == null || request.walletAddress() == null || request.nonce() == null || request.signature() == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"walletAddress, nonce, and signature are required\"}")
                    .build();
        }

        String wallet = request.walletAddress().trim();
        String nonce = request.nonce().trim();
        String signature = request.signature().trim();

        // 1. Validate nonce existence in memory
        boolean nonceValid = nonceService.validateAndConsume(wallet, nonce);
        if (!nonceValid) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity("{\"error\": \"Invalid or expired nonce\"}")
                    .build();
        }

        // 2. Validate cryptographic signature
        String expectedStatement = nonceService.getExpectedStatement(nonce);
        boolean sigValid = cryptoService.verifySignature(wallet, expectedStatement, signature);
        if (!sigValid) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity("{\"error\": \"Cryptographic signature verification failed\"}")
                    .build();
        }

        // 3. Issue JWT
        String token = jwtService.generateWalletUserToken(wallet);
        AuthTokenResponse response = new AuthTokenResponse(
                token,
                "Bearer",
                jwtService.getExpirationSeconds(),
                wallet
        );

        return Response.ok(response).build();
    }
}
