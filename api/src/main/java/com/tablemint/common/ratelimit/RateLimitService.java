package com.tablemint.common.ratelimit;

import com.tablemint.common.error.DomainException;
import com.tablemint.common.error.ErrorCode;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitService {

    public static final int LOGIN_MAX_ATTEMPTS = 5;
    public static final Duration LOGIN_WINDOW = Duration.ofMinutes(1);

    public static final int CONTACT_MAX_REQUESTS = 5;
    public static final Duration CONTACT_WINDOW = Duration.ofHours(1);

    private final Clock clock;
    private final Map<String, Deque<Instant>> buckets = new ConcurrentHashMap<>();

    public RateLimitService(Clock clock) {
        this.clock = clock;
    }

    public void checkLoginRateLimit(String key) {
        checkLimit("LOGIN:" + (key != null ? key : "unknown"), LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW);
    }

    public void checkContactRateLimit(String key) {
        checkLimit("CONTACT:" + (key != null ? key : "unknown"), CONTACT_MAX_REQUESTS, CONTACT_WINDOW);
    }

    public void checkLimit(String bucketKey, int maxRequests, Duration window) {
        Instant now = Instant.now(clock);
        Instant cutoff = now.minus(window);

        Deque<Instant> timestamps = buckets.computeIfAbsent(bucketKey, k -> new ArrayDeque<>());
        synchronized (timestamps) {
            while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(cutoff)) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= maxRequests) {
                Instant oldest = timestamps.peekFirst();
                long retryAfterSeconds = Math.max(1L, Duration.between(now, oldest.plus(window)).getSeconds());
                throw new DomainException(ErrorCode.RATE_LIMITED, retryAfterSeconds);
            }
            timestamps.addLast(now);
        }
    }

    public void clearAll() {
        buckets.clear();
    }
}
