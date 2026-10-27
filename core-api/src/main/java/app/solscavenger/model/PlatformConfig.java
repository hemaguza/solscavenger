package app.solscavenger.model;

import io.quarkus.hibernate.reactive.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "platform_config")
public class PlatformConfig extends PanacheEntityBase {

    @Id
    @Column(name = "config_key", nullable = false, unique = true, length = 64)
    public String key;

    @Column(name = "config_value", nullable = false, length = 255)
    public String value;

    @Column(name = "description", length = 255)
    public String description;

    @Column(name = "updated_at")
    public Instant updatedAt = Instant.now();

    public PlatformConfig() {}

    public PlatformConfig(String key, String value, String description) {
        this.key = key;
        this.value = value;
        this.description = description;
        this.updatedAt = Instant.now();
    }
}

