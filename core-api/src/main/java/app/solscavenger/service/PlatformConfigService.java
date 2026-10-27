package app.solscavenger.service;

import app.solscavenger.dto.TreasuryConfigDto;
import app.solscavenger.dto.UpdateTreasuryConfigRequest;
import app.solscavenger.model.PlatformConfig;
import io.quarkus.hibernate.reactive.panache.Panache;
import io.quarkus.runtime.StartupEvent;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.List;

@ApplicationScoped
public class PlatformConfigService {

    private static final Logger LOG = Logger.getLogger(PlatformConfigService.class);

    public static final String KEY_TREASURY_WALLET = "TREASURY_WALLET";
    public static final String KEY_FEE_PERCENTAGE = "FEE_PERCENTAGE";
    public static final String KEY_SOLANA_RPC_URL = "SOLANA_RPC_URL";
    public static final String KEY_SOLANA_NETWORK = "SOLANA_NETWORK";

    @ConfigProperty(name = "solscavenger.solana.treasury-wallet")
    String defaultTreasuryWallet;

    @ConfigProperty(name = "solscavenger.solana.fee-percentage", defaultValue = "0.025")
    double defaultFeePercentage;

    @ConfigProperty(name = "solscavenger.solana.rpc-url", defaultValue = "https://api.mainnet-beta.solana.com")
    String defaultRpcUrl;

    @ConfigProperty(name = "solscavenger.solana.network", defaultValue = "mainnet-beta")
    String defaultNetwork;

    // In-memory cache for ultra-fast, zero-overhead access during on-chain operations
    private volatile String cachedTreasuryWallet;
    private volatile double cachedFeePercentage;
    private volatile String cachedRpcUrl;
    private volatile String cachedNetwork;
    private volatile Instant lastUpdatedAt = Instant.now();

    void onStart(@Observes StartupEvent ev) {
        // Fallback to properties initially
        this.cachedTreasuryWallet = defaultTreasuryWallet;
        this.cachedFeePercentage = defaultFeePercentage;
        this.cachedRpcUrl = defaultRpcUrl;
        this.cachedNetwork = defaultNetwork;
        LOG.infof("Platform config initialized in memory (fallback defaults ready): Treasury=%s, Fee=%.2f%%, Network=%s, Rpc=%s",
                this.cachedTreasuryWallet, this.cachedFeePercentage * 100, this.cachedNetwork, this.cachedRpcUrl);
    }

    public String getTreasuryWallet() {
        return cachedTreasuryWallet != null ? cachedTreasuryWallet : defaultTreasuryWallet;
    }

    public double getFeePercentage() {
        return cachedFeePercentage > 0 ? cachedFeePercentage : defaultFeePercentage;
    }

    public String getRpcUrl() {
        return cachedRpcUrl != null ? cachedRpcUrl : defaultRpcUrl;
    }

    public String getSolanaNetwork() {
        return cachedNetwork != null ? cachedNetwork : defaultNetwork;
    }

    public Instant getLastUpdatedAt() {
        return lastUpdatedAt;
    }

    /**
     * Retrieves current dynamic configuration from DB or cache.
     */
    public Uni<TreasuryConfigDto> getConfig() {
        return Panache.withSession(() ->
                PlatformConfig.<PlatformConfig>listAll()
                        .flatMap(configs -> {
                            if (configs.isEmpty()) {
                                return seedDefaultConfigs();
                            }
                            syncCacheFromList(configs);
                            return Uni.createFrom().item(getCurrentDto());
                        })
        ).onFailure().recoverWithItem(err -> {
            LOG.warnf("Could not query PlatformConfig from DB (using cached): %s", err.getMessage());
            return getCurrentDto();
        });
    }

    /**
     * Updates platform configuration in real time with zero-restart.
     */
    public Uni<TreasuryConfigDto> updateConfig(UpdateTreasuryConfigRequest request) {
        if (request == null) {
            return Uni.createFrom().failure(new BadRequestException("Request body cannot be empty"));
        }

        // Validate treasury wallet
        if (request.treasuryWallet() != null && !request.treasuryWallet().isBlank()) {
            String wallet = request.treasuryWallet().trim();
            if (wallet.length() < 32 || wallet.length() > 44) {
                return Uni.createFrom().failure(new BadRequestException("Invalid Solana wallet address length"));
            }
        }

        // Validate fee percentage
        if (request.feePercentage() != null) {
            double fee = request.feePercentage();
            if (fee < 0.0 || fee > 0.50) {
                return Uni.createFrom().failure(new BadRequestException("Fee percentage must be between 0.0 (0%) and 0.50 (50%)"));
            }
        }

        return Panache.withTransaction(() ->
                PlatformConfig.<PlatformConfig>listAll()
                        .flatMap(configs -> {
                            Instant now = Instant.now();

                            return upsertKey(KEY_TREASURY_WALLET, request.treasuryWallet(), "Solana Treasury Wallet Address", now)
                                    .flatMap(w -> upsertKey(KEY_FEE_PERCENTAGE,
                                            request.feePercentage() != null ? String.valueOf(request.feePercentage()) : null,
                                            "Platform Fee Percentage (0.00 - 0.50)", now))
                                    .flatMap(f -> upsertKey(KEY_SOLANA_RPC_URL, request.rpcUrl(), "Solana RPC Node URL", now))
                                    .flatMap(r -> upsertKey(KEY_SOLANA_NETWORK, request.solanaNetwork(), "Solana Network Cluster", now))
                                    .map(ignore -> {
                                        if (request.treasuryWallet() != null && !request.treasuryWallet().isBlank()) {
                                            this.cachedTreasuryWallet = request.treasuryWallet().trim();
                                        }
                                        if (request.feePercentage() != null) {
                                            this.cachedFeePercentage = request.feePercentage();
                                        }
                                        if (request.rpcUrl() != null && !request.rpcUrl().isBlank()) {
                                            this.cachedRpcUrl = request.rpcUrl().trim();
                                        }
                                        if (request.solanaNetwork() != null && !request.solanaNetwork().isBlank()) {
                                            this.cachedNetwork = request.solanaNetwork().trim();
                                        }
                                        this.lastUpdatedAt = now;

                                        LOG.infof("Platform config dynamically updated: Treasury=%s, Fee=%.2f%%, Network=%s",
                                                this.cachedTreasuryWallet, this.cachedFeePercentage * 100, this.cachedNetwork);

                                        return getCurrentDto();
                                    });
                        })
        );
    }

    private Uni<PlatformConfig> upsertKey(String key, String value, String description, Instant now) {
        if (value == null || value.isBlank()) {
            return PlatformConfig.<PlatformConfig>findById(key);
        }
        return PlatformConfig.<PlatformConfig>findById(key)
                .flatMap(existing -> {
                    if (existing != null) {
                        existing.value = value.trim();
                        existing.updatedAt = now;
                        return existing.persist();
                    } else {
                        PlatformConfig created = new PlatformConfig(key, value.trim(), description);
                        created.updatedAt = now;
                        return created.persist();
                    }
                });
    }

    private Uni<TreasuryConfigDto> seedDefaultConfigs() {
        Instant now = Instant.now();
        PlatformConfig walletConfig = new PlatformConfig(KEY_TREASURY_WALLET, defaultTreasuryWallet, "Solana Treasury Wallet Address");
        PlatformConfig feeConfig = new PlatformConfig(KEY_FEE_PERCENTAGE, String.valueOf(defaultFeePercentage), "Platform Fee Percentage (0.00 - 0.50)");
        PlatformConfig rpcConfig = new PlatformConfig(KEY_SOLANA_RPC_URL, defaultRpcUrl, "Solana RPC Node URL");
        PlatformConfig netConfig = new PlatformConfig(KEY_SOLANA_NETWORK, defaultNetwork, "Solana Network Cluster");

        return Panache.withTransaction(() ->
                walletConfig.persist()
                        .chain(() -> feeConfig.persist())
                        .chain(() -> rpcConfig.persist())
                        .chain(() -> netConfig.persist())
                        .map(ignore -> {
                            this.cachedTreasuryWallet = defaultTreasuryWallet;
                            this.cachedFeePercentage = defaultFeePercentage;
                            this.cachedRpcUrl = defaultRpcUrl;
                            this.cachedNetwork = defaultNetwork;
                            this.lastUpdatedAt = now;
                            return getCurrentDto();
                        })
        );
    }

    private void syncCacheFromList(List<PlatformConfig> configs) {
        for (PlatformConfig c : configs) {
            switch (c.key) {
                case KEY_TREASURY_WALLET -> this.cachedTreasuryWallet = c.value;
                case KEY_FEE_PERCENTAGE -> {
                    try {
                        this.cachedFeePercentage = Double.parseDouble(c.value);
                    } catch (NumberFormatException ignored) {}
                }
                case KEY_SOLANA_RPC_URL -> this.cachedRpcUrl = c.value;
                case KEY_SOLANA_NETWORK -> this.cachedNetwork = c.value;
            }
            if (c.updatedAt != null && c.updatedAt.isAfter(this.lastUpdatedAt)) {
                this.lastUpdatedAt = c.updatedAt;
            }
        }
    }

    private TreasuryConfigDto getCurrentDto() {
        return new TreasuryConfigDto(
                getTreasuryWallet(),
                getFeePercentage(),
                getSolanaNetwork(),
                getRpcUrl(),
                lastUpdatedAt
        );
    }
}
