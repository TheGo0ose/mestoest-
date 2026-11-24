package com.tablemint.common.idempotency;

import com.tablemint.common.error.DomainException;
import com.tablemint.common.error.ErrorCode;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Optional;

@Service
public class IdempotencyService {

    private final IdempotencyRepository repository;
    private final Clock clock;

    public IdempotencyService(IdempotencyRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    public static String computeHash(String payload) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    @Transactional
    public Optional<IdempotencyRecord> lockAndCheck(String scope, String idemKey, String requestHash) {
        Optional<IdempotencyRecord> existing = repository.findByScopeAndIdemKeyForUpdate(scope, idemKey);
        if (existing.isPresent()) {
            IdempotencyRecord record = existing.get();
            if (!record.getRequestHash().equals(requestHash)) {
                throw new DomainException(ErrorCode.IDEMPOTENCY_KEY_MISMATCH);
            }
            return Optional.of(record);
        }
        return Optional.empty();
    }

    @Transactional
    public IdempotencyRecord saveRecord(String scope, String idemKey, String requestHash, int status, String responseBody) {
        IdempotencyRecord record = new IdempotencyRecord(
                scope,
                idemKey,
                requestHash,
                status,
                responseBody,
                Instant.now(clock)
        );
        return repository.save(record);
    }

    @Scheduled(cron = "0 0 * * * *") // Every hour
    @Transactional
    public void cleanupExpiredRecords() {
        Instant cutoff = Instant.now(clock).minus(24, ChronoUnit.HOURS);
        repository.deleteOlderThan(cutoff);
    }
}
