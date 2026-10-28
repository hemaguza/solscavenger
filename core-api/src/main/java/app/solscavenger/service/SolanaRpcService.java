package app.solscavenger.service;

import app.solscavenger.dto.DormantAccountDto;
import app.solscavenger.dto.ScanResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class SolanaRpcService {

    private static final Logger LOG = Logger.getLogger(SolanaRpcService.class);

    @ConfigProperty(name = "solscavenger.solana.rpc-url")
    String rpcUrl;

    @ConfigProperty(name = "solscavenger.solana.treasury-wallet")
    String treasuryWallet;

    @ConfigProperty(name = "solscavenger.solana.fee-percentage", defaultValue = "0.025")
    double feePercentage;

    @Inject
    PlatformConfigService platformConfigService;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    SolanaTransactionBuilder transactionBuilder;

    private static final String SPL_TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
    private static final String TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
    private static final long STANDARD_RENT_LAMPORTS = 2039280L;
    private static final BigDecimal LAMPORTS_IN_SOL = BigDecimal.valueOf(1000000000L);

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public String getTreasuryWallet() {
        return platformConfigService != null ? platformConfigService.getTreasuryWallet() : treasuryWallet;
    }

    public double getFeePercentage() {
        return platformConfigService != null ? platformConfigService.getFeePercentage() : feePercentage;
    }

    public String getRpcUrl() {
        return platformConfigService != null ? platformConfigService.getRpcUrl() : rpcUrl;
    }

    public String getLatestBlockhash() throws Exception {
        Map<String, Object> rpcPayload = Map.of(
                "jsonrpc", "2.0",
                "id", 1,
                "method", "getLatestBlockhash",
                "params", List.of(Map.of("commitment", "confirmed"))
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(getRpcUrl()))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(10))
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(rpcPayload)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 200) {
            JsonNode root = objectMapper.readTree(response.body());
            String blockhash = root.path("result").path("value").path("blockhash").asText();
            if (blockhash != null && !blockhash.isBlank()) {
                return blockhash;
            }
        }
        throw new IllegalStateException("Failed to obtain latest blockhash from Solana RPC: " + response.body());
    }

    public SolanaTransactionBuilder.CompiledBatchResult buildReclaimTransactions(
            String walletAddress,
            List<DormantAccountDto> accounts
    ) throws Exception {
        String blockhash = getLatestBlockhash();
        return transactionBuilder.buildBatchTransactions(walletAddress, accounts, blockhash, getTreasuryWallet(), getFeePercentage());
    }

    /**
     * Relays a signed Solana transaction directly to the configured Solana RPC cluster.
     * Bypasses browser Cloudflare / 403 restrictions and provides server-side error mapping.
     */
    public String sendRawTransaction(String base64Tx) throws Exception {
        Map<String, Object> rpcPayload = Map.of(
                "jsonrpc", "2.0",
                "id", 1,
                "method", "sendTransaction",
                "params", List.of(
                        base64Tx,
                        Map.of(
                                "encoding", "base64",
                                "skipPreflight", false,
                                "preflightCommitment", "processed",
                                "maxRetries", 3
                        )
                )
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(getRpcUrl()))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(25))
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(rpcPayload)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 200) {
            JsonNode root = objectMapper.readTree(response.body());
            if (root.has("error")) {
                JsonNode err = root.path("error");
                String errMsg = err.path("message").asText("Solana RPC transaction error");
                JsonNode data = err.path("data");
                if (!data.isMissingNode() && !data.isNull()) {
                    errMsg += " -> " + data.toString();
                }
                throw new IllegalArgumentException(errMsg);
            }
            String signature = root.path("result").asText();
            if (signature != null && !signature.isBlank()) {
                return signature;
            }
        }
        throw new IllegalStateException("Failed to send transaction to Solana RPC: HTTP " + response.statusCode() + " -> " + response.body());
    }

    public boolean verifyReclaimTransactionOnChain(String txSignature) {
        if (txSignature == null || txSignature.isBlank() || txSignature.length() < 64) {
            return false;
        }

        // Retry loop to accommodate block confirmation propagation (up to 3 seconds)
        for (int attempt = 0; attempt < 3; attempt++) {
            try {
                Map<String, Object> rpcPayload = Map.of(
                        "jsonrpc", "2.0",
                        "id", 1,
                        "method", "getSignatureStatuses",
                        "params", List.of(
                                List.of(txSignature),
                                Map.of("searchTransactionHistory", true)
                        )
                );

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(getRpcUrl()))
                        .header("Content-Type", "application/json")
                        .timeout(Duration.ofSeconds(6))
                        .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(rpcPayload)))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(response.body());
                    JsonNode valueArray = root.path("result").path("value");
                    if (valueArray.isArray() && valueArray.size() > 0) {
                        JsonNode status = valueArray.get(0);
                        if (status != null && !status.isNull() && !status.isMissingNode()) {
                            boolean hasErr = !status.path("err").isNull() && !status.path("err").isMissingNode();
                            String confirmation = status.path("confirmationStatus").asText("");
                            if (!hasErr && ("confirmed".equals(confirmation) || "finalized".equals(confirmation) || "processed".equals(confirmation))) {
                                return true;
                            }
                        }
                    }
                }
            } catch (Exception ignored) {}

            try {
                Thread.sleep(1000);
            } catch (InterruptedException ignored) {}
        }
        return false;
    }

    public long getMinimumRentExemption(int dataSize) {
        try {
            Map<String, Object> rpcPayload = Map.of(
                    "jsonrpc", "2.0",
                    "id", 1,
                    "method", "getMinimumBalanceForRentExemption",
                    "params", List.of(dataSize)
            );
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(getRpcUrl()))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(6))
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(rpcPayload)))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                long rent = root.path("result").asLong(0L);
                if (rent > 0) {
                    return rent;
                }
            }
        } catch (Exception e) {
            // fallback
        }
        return 1488440L; // Fallback to current network baseline (SIMD-0437 Step 2)
    }

    public ScanResponse scanWallet(String walletAddress) throws Exception {
        List<DormantAccountDto> candidateAccounts = new ArrayList<>();
        long currentMinRent = getMinimumRentExemption(165);

        // 1. Scan standard SPL Token program
        queryProgramAccounts(walletAddress, SPL_TOKEN_PROGRAM, candidateAccounts, currentMinRent);

        // 2. Scan Token-2022 program
        queryProgramAccounts(walletAddress, TOKEN_2022_PROGRAM, candidateAccounts, currentMinRent);

        long totalLamports = candidateAccounts.stream()
                .mapToLong(DormantAccountDto::reclaimableLamports)
                .sum();

        BigDecimal totalSol = BigDecimal.valueOf(totalLamports)
                .divide(LAMPORTS_IN_SOL, 9, RoundingMode.HALF_UP);

        BigDecimal platformFeeSol = totalSol.multiply(BigDecimal.valueOf(getFeePercentage()))
                .setScale(9, RoundingMode.HALF_UP);

        BigDecimal userNetRefundSol = totalSol.subtract(platformFeeSol)
                .setScale(9, RoundingMode.HALF_UP);

        BigDecimal estimatedUsd = totalSol.multiply(BigDecimal.valueOf(150.0))
                .setScale(2, RoundingMode.HALF_UP);

        return new ScanResponse(
                walletAddress,
                candidateAccounts.size(),
                totalSol,
                userNetRefundSol,
                platformFeeSol,
                estimatedUsd,
                candidateAccounts
        );
    }

    private void queryProgramAccounts(String walletAddress, String programId, List<DormantAccountDto> targetList, long currentMinRent) {
        try {
            Map<String, Object> rpcPayload = Map.of(
                    "jsonrpc", "2.0",
                    "id", 1,
                    "method", "getTokenAccountsByOwner",
                    "params", List.of(
                            walletAddress,
                            Map.of("programId", programId),
                            Map.of("encoding", "jsonParsed", "commitment", "confirmed")
                    )
            );

            String requestBody = objectMapper.writeValueAsString(rpcPayload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(getRpcUrl()))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode valueArray = root.path("result").path("value");

                if (valueArray.isArray()) {
                    for (JsonNode item : valueArray) {
                        JsonNode parsed = item.path("account").path("data").path("parsed");
                        JsonNode info = parsed.path("info");
                        String amount = info.path("tokenAmount").path("amount").asText("0");
                        String pubkey = item.path("pubkey").asText();
                        String mint = info.path("mint").asText();
                        int decimals = info.path("tokenAmount").path("decimals").asInt(0);
                        long lamports = item.path("account").path("lamports").asLong(currentMinRent);

                        if ("0".equals(amount)) {
                            // Zero balance ATA: can be fully closed to recover 100% of stored rent
                            BigDecimal reclaimableSol = BigDecimal.valueOf(lamports)
                                    .divide(LAMPORTS_IN_SOL, 9, RoundingMode.HALF_UP);

                            targetList.add(new DormantAccountDto(
                                    pubkey,
                                    mint,
                                    BigDecimal.ZERO,
                                    decimals,
                                    lamports,
                                    reclaimableSol,
                                    programId,
                                    "CLOSE"
                            ));
                        } else {
                            // Active account with tokens: Check if holding excess rent from SIMD-0437
                            long excessLamports = lamports - currentMinRent;
                            if (excessLamports > 0) {
                                double uiAmount = info.path("tokenAmount").path("uiAmount").asDouble(0.0);
                                BigDecimal reclaimableSol = BigDecimal.valueOf(excessLamports)
                                        .divide(LAMPORTS_IN_SOL, 9, RoundingMode.HALF_UP);

                                targetList.add(new DormantAccountDto(
                                        pubkey,
                                        mint,
                                        BigDecimal.valueOf(uiAmount),
                                        decimals,
                                        excessLamports,
                                        reclaimableSol,
                                        programId,
                                        "WITHDRAW_EXCESS"
                                ));
                            }
                        }
                    }
                }
            } else {
                LOG.warnf("Solana RPC returned status %d for program %s: %s", response.statusCode(), programId, response.body());
            }
        } catch (Exception e) {
            LOG.warnf("Failed to query Solana RPC for program %s: %s", programId, e.getMessage());
        }
    }
}
