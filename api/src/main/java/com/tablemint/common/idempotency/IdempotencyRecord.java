package com.tablemint.common.idempotency;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "idempotency_record", uniqueConstraints = {
        @UniqueConstraint(name = "uq_idempotency_scope_key", columnNames = {"scope", "idem_key"})
})
@Getter
@Setter
@NoArgsConstructor
public class IdempotencyRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "scope", nullable = false, length = 64)
    private String scope;

    @Column(name = "idem_key", nullable = false, length = 128)
    private String idemKey;

    @Column(name = "request_hash", nullable = false, length = 64)
    private String requestHash;

    @Column(name = "response_status", nullable = false)
    private Integer responseStatus;

    @Column(name = "response_body", columnDefinition = "TEXT")
    private String responseBody;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public IdempotencyRecord(String scope, String idemKey, String requestHash, Integer responseStatus, String responseBody, Instant createdAt) {
        this.scope = scope;
        this.idemKey = idemKey;
        this.requestHash = requestHash;
        this.responseStatus = responseStatus;
        this.responseBody = responseBody;
        this.createdAt = createdAt;
    }
}
