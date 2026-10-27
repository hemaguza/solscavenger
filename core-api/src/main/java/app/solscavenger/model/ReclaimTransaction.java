package app.solscavenger.model;

import io.quarkus.hibernate.reactive.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "reclaim_transactions", indexes = {
    @Index(name = "idx_reclaim_wallet", columnList = "wallet_address"),
    @Index(name = "idx_reclaim_created", columnList = "created_at")
})
public class ReclaimTransaction extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "tx_signature", nullable = false, unique = true, length = 128)
    public String txSignature;

    @Column(name = "wallet_address", nullable = false, length = 64)
    public String walletAddress;

    @Column(name = "accounts_closed_count", nullable = false)
    public Integer accountsClosedCount;

    @Column(name = "total_sol_recovered", nullable = false, precision = 18, scale = 9)
    public BigDecimal totalSolRecovered;

    @Column(name = "user_sol_received", nullable = false, precision = 18, scale = 9)
    public BigDecimal userSolReceived;

    @Column(name = "platform_fee_sol", nullable = false, precision = 18, scale = 9)
    public BigDecimal platformFeeSol;

    @Column(name = "platform_fee_usd", precision = 12, scale = 4)
    public BigDecimal platformFeeUsd;

    @Column(nullable = false, length = 20)
    public String status = "CONFIRMED";

    @Column(name = "created_at")
    public Instant createdAt = Instant.now();
}
