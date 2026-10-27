package app.solscavenger.model;

import io.quarkus.hibernate.reactive.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "wallet_scan_events", indexes = {
    @Index(name = "idx_scan_wallet", columnList = "wallet_address"),
    @Index(name = "idx_scan_created", columnList = "created_at")
})
public class WalletScanEvent extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "wallet_address", nullable = false, length = 64)
    public String walletAddress;

    @Column(name = "accounts_found_count", nullable = false)
    public Integer accountsFoundCount;

    @Column(name = "potential_sol_reclaim", nullable = false, precision = 18, scale = 9)
    public BigDecimal potentialSolReclaim;

    @Column(name = "dormant_token_mints", columnDefinition = "TEXT")
    public String dormantTokenMints;

    @Column(name = "converted_to_reclaim")
    public Boolean convertedToReclaim = false;

    @Column(name = "user_agent", length = 255)
    public String userAgent;

    @Column(name = "ip_country", length = 4)
    public String ipCountry;

    @Column(name = "created_at")
    public Instant createdAt = Instant.now();
}
