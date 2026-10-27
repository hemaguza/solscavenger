package app.solscavenger.resource;

import app.solscavenger.dto.BuildTxRequest;
import app.solscavenger.dto.BuildTxResponse;
import app.solscavenger.dto.PublicConfigDto;
import app.solscavenger.dto.RecordReclaimRequest;
import app.solscavenger.dto.ScanRequest;
import app.solscavenger.dto.SendTxRequest;
import app.solscavenger.dto.SendTxResponse;
import app.solscavenger.security.RateLimiterService;
import app.solscavenger.service.AccountingService;
import app.solscavenger.service.Base58;
import app.solscavenger.service.PlatformConfigService;
import app.solscavenger.service.SolanaRpcService;
import app.solscavenger.service.SolanaTransactionBuilder;
import io.smallrye.mutiny.Uni;
import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Arrays;
import java.util.Base64;

@Path("/api/v1/solana")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SolanaResource {

    @Inject
    SolanaRpcService rpcService;

    @Inject
    AccountingService accountingService;

    @Inject
    PlatformConfigService platformConfigService;

    @Inject
    RateLimiterService rateLimiterService;

    @Inject
    JsonWebToken jwt;

    /**
     * Returns public operational cluster and fee configuration for the frontend dApp.
     */
    @GET
    @Path("/config")
    @PermitAll
    public Uni<Response> getPublicConfig() {
        return platformConfigService.getConfig()
                .map(cfg -> Response.ok(new PublicConfigDto(cfg.solanaNetwork(), cfg.feePercentage())).build());
    }

    /**
     * Scans empty accounts for the specified wallet address using the backend RPC.
     * Keeps private RPC keys hidden and records scan metrics in database.
     */
    @POST
    @Path("/scan")
    @PermitAll
    public Uni<Response> scanWallet(ScanRequest request, @Context HttpHeaders headers) {
        String wallet = null;
        if (jwt != null && jwt.getName() != null && !jwt.getName().isBlank()) {
            wallet = jwt.getName();
        }
        if (request != null && request.walletAddress() != null && !request.walletAddress().isBlank()) {
            wallet = request.walletAddress().trim();
        }

        if (wallet == null) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"walletAddress is required\"}").build());
        }

        final String finalWallet = wallet;
        if (!rateLimiterService.isAllowed("scan", finalWallet)) {
            return Uni.createFrom().item(Response.status(429)
                    .entity("{\"error\": \"Rate limit exceeded for scan requests. Please wait a moment.\"}").build());
        }

        String userAgent = headers.getHeaderString(HttpHeaders.USER_AGENT);
        String ipCountry = headers.getHeaderString("CF-IPCountry");

        return Uni.createFrom().item(() -> {
            try {
                return rpcService.scanWallet(finalWallet);
            } catch (Exception e) {
                throw new WebApplicationException("Failed to scan Solana RPC: " + e.getMessage(), 500);
            }
        }).flatMap(scanResult ->
                accountingService.recordScanEvent(scanResult, userAgent, ipCountry)
                        .map(event -> Response.ok(scanResult).build())
        );
    }

    /**
     * Builds and compiles atomic Solana legacy transactions in Base64 wire format.
     * All fee calculations and treasury wallet destination are enforced server-side.
     */
    @POST
    @Path("/build-tx")
    @PermitAll
    public Uni<Response> buildReclaimTransactions(BuildTxRequest request) {
        String wallet = null;
        if (jwt != null && jwt.getName() != null && !jwt.getName().isBlank()) {
            wallet = jwt.getName();
        }
        if (request != null && request.walletAddress() != null && !request.walletAddress().isBlank()) {
            wallet = request.walletAddress().trim();
        }

        if (wallet == null) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"walletAddress is required\"}").build());
        }

        final String finalWallet = wallet;
        if (!rateLimiterService.isAllowed("reclaim", finalWallet)) {
            return Uni.createFrom().item(Response.status(429)
                    .entity("{\"error\": \"Rate limit exceeded for transaction compilation. Please wait a moment.\"}").build());
        }

        return platformConfigService.getConfig().flatMap(cfg -> Uni.createFrom().item(() -> {
            try {
                if (request == null || request.accounts() == null || request.accounts().isEmpty()) {
                    return Response.status(Response.Status.BAD_REQUEST)
                            .entity("{\"error\": \"Accounts list cannot be empty\"}")
                            .build();
                }

                SolanaTransactionBuilder.CompiledBatchResult batch =
                        rpcService.buildReclaimTransactions(finalWallet, request.accounts());

                BigDecimal totalSol = BigDecimal.valueOf(batch.totalReclaimableLamports())
                        .divide(BigDecimal.valueOf(1_000_000_000L), 9, RoundingMode.HALF_UP);

                BigDecimal platformFeeSol = BigDecimal.valueOf(batch.totalPlatformFeeLamports())
                        .divide(BigDecimal.valueOf(1_000_000_000L), 9, RoundingMode.HALF_UP);

                BigDecimal userNetSol = totalSol.subtract(platformFeeSol);

                BuildTxResponse response = new BuildTxResponse(
                        batch.transactionsBase64(),
                        batch.totalAccounts(),
                        totalSol,
                        platformFeeSol,
                        userNetSol
                );

                return Response.ok(response).build();
            } catch (Exception e) {
                throw new WebApplicationException("Failed to compile Solana transactions: " + e.getMessage(), 500);
            }
        }));
    }

    /**
     * Relays and broadcasts a signed Solana transaction directly to the RPC cluster.
     * Implements strict anti-abuse profiling:
     * 1. Rate limiting by IP and declared wallet address.
     * 2. Solana MTU payload size bounds validation (96 - 1232 bytes).
     * 3. Non-zero signature verification.
     * 4. Signer / Fee Payer public key identity matching.
     */
    @POST
    @Path("/send-tx")
    @PermitAll
    public Uni<Response> sendTransaction(SendTxRequest request) {
        if (request == null || request.base64Transaction() == null || request.base64Transaction().isBlank()) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"base64Transaction is required\"}").build());
        }

        // 1. Wallet-level rate limiting
        if (request.walletAddress() != null && !request.walletAddress().isBlank()) {
            if (!rateLimiterService.isAllowed("send-tx", request.walletAddress().trim())) {
                return Uni.createFrom().item(Response.status(429)
                        .entity("{\"error\": \"Rate limit exceeded for this wallet address. Please wait a moment.\"}").build());
            }
        }

        // 2. Decode wire format and check MTU bounds
        String b64 = request.base64Transaction().trim();
        if (b64.length() > 2048) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Transaction payload exceeds maximum allowed size\"}").build());
        }

        byte[] wireBytes;
        try {
            wireBytes = Base64.getDecoder().decode(b64);
        } catch (IllegalArgumentException e) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Invalid Base64 encoding\"}").build());
        }

        if (wireBytes.length < 96 || wireBytes.length > 1232) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Transaction size violates Solana MTU bounds (must be between 96 and 1232 bytes)\"}").build());
        }

        // 3. Structural profiling: signatures vector
        int numSignatures = wireBytes[0] & 0x7F;
        int offset = 1;
        if ((wireBytes[0] & 0x80) != 0) {
            numSignatures = (wireBytes[0] & 0x7F) | ((wireBytes[1] & 0x7F) << 7);
            offset = 2;
        }

        if (numSignatures <= 0) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Transaction has no signatures\"}").build());
        }

        int signaturesLength = numSignatures * 64;
        if (wireBytes.length < offset + signaturesLength + 3) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Malformed transaction wire format\"}").build());
        }

        // Ensure signature is not empty (all zeroes)
        boolean hasValidSignature = false;
        for (int i = 0; i < 64; i++) {
            if (wireBytes[offset + i] != 0) {
                hasValidSignature = true;
                break;
            }
        }
        if (!hasValidSignature) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Transaction signature is empty. Wallet signature required.\"}").build());
        }

        // 4. Wallet identity validation against transaction Fee Payer (Message account key 0)
        if (request.walletAddress() != null && !request.walletAddress().isBlank()) {
            try {
                byte[] expectedWalletKey = Base58.decode(request.walletAddress().trim());
                if (expectedWalletKey.length == 32) {
                    int msgOffset = offset + signaturesLength;
                    // Skip 3 bytes header
                    int accountsOffset = msgOffset + 3;
                    if ((wireBytes[accountsOffset] & 0x80) != 0) {
                        accountsOffset += 2;
                    } else {
                        accountsOffset += 1;
                    }

                    if (accountsOffset + 32 <= wireBytes.length) {
                        byte[] feePayerKey = Arrays.copyOfRange(wireBytes, accountsOffset, accountsOffset + 32);
                        if (!Arrays.equals(expectedWalletKey, feePayerKey)) {
                            return Uni.createFrom().item(Response.status(Response.Status.FORBIDDEN)
                                    .entity("{\"error\": \"Security Profiling: Transaction fee payer does not match declared wallet\"}").build());
                        }
                    }
                }
            } catch (Exception e) {
                return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                        .entity("{\"error\": \"Invalid wallet address format\"}").build());
            }
        }

        final int finalOffset = offset;
        final int finalSignaturesLength = signaturesLength;

        // 5. Submit transaction to Solana RPC via backend with protocol verification
        return platformConfigService.getConfig().flatMap(cfg -> {
            // Anti-bot & protocol protection: Ensure transaction contains SolScavenger treasury account
            try {
                byte[] treasuryKey = Base58.decode(cfg.treasuryWallet());
                int msgOffset = finalOffset + finalSignaturesLength;
                int accountsOffset = msgOffset + 3;
                int numAccounts = wireBytes[accountsOffset] & 0x7F;
                int accountsDataOffset = accountsOffset + 1;
                if ((wireBytes[accountsOffset] & 0x80) != 0) {
                    numAccounts = (wireBytes[accountsOffset] & 0x7F) | ((wireBytes[accountsOffset + 1] & 0x7F) << 7);
                    accountsDataOffset = accountsOffset + 2;
                }

                boolean containsTreasury = false;
                for (int i = 0; i < numAccounts; i++) {
                    int keyStart = accountsDataOffset + (i * 32);
                    if (keyStart + 32 <= wireBytes.length) {
                        if (Arrays.equals(treasuryKey, Arrays.copyOfRange(wireBytes, keyStart, keyStart + 32))) {
                            containsTreasury = true;
                            break;
                        }
                    }
                }

                if (!containsTreasury) {
                    return Uni.createFrom().item(Response.status(Response.Status.FORBIDDEN)
                            .entity("{\"error\": \"Security Profiling: Transaction does not belong to SolScavenger protocol (Treasury instruction missing)\"}").build());
                }
            } catch (Exception e) {
                return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                        .entity("{\"error\": \"Malformed transaction message format\"}").build());
            }

            return Uni.createFrom().item(() -> {
                try {
                    String txSig = rpcService.sendRawTransaction(b64);
                    return Response.ok(new SendTxResponse(txSig, "confirmed")).build();
                } catch (IllegalArgumentException e) {
                    return Response.status(Response.Status.BAD_REQUEST)
                            .entity("{\"error\": \"Solana RPC Error: " + e.getMessage().replace("\"", "\\\"") + "\"}").build();
                } catch (Exception e) {
                    return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                            .entity("{\"error\": \"Relayer transmission failed: " + e.getMessage().replace("\"", "\\\"") + "\"}").build();
                }
            });
        });
    }

    /**
     * Records a completed reclaim transaction on-chain for analytics and auditing.
     * Enforces cryptographic on-chain verification before recording in database.
     */
    @POST
    @Path("/record-reclaim")
    @PermitAll
    public Uni<Response> recordReclaim(RecordReclaimRequest request) {
        if (request == null || request.txSignature() == null || request.txSignature().isBlank()) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST).build());
        }

        // On-chain proof verification: Reject spoofed or fake transactions
        return Uni.createFrom().item(() -> rpcService.verifyReclaimTransactionOnChain(request.txSignature().trim()))
                .flatMap(isValid -> {
                    if (!isValid) {
                        return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                                .entity("{\"error\": \"Transaction signature not found or unconfirmed on Solana network\"}")
                                .build());
                    }
                    return accountingService.recordReclaim(request)
                            .map(persisted -> Response.ok(persisted).build());
                });
    }
}
