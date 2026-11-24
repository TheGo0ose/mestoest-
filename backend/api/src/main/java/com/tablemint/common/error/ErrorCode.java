package com.tablemint.common.error;

import org.springframework.http.HttpStatus;

/**
 * 21 фиксированный код ошибки по спецификации TableMint 1.1 (Раздел 1.7 и 1.13).
 */
public enum ErrorCode {
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(HttpStatus.UNAUTHORIZED),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED),
    FORBIDDEN(HttpStatus.FORBIDDEN),
    PASSWORD_CHANGE_REQUIRED(HttpStatus.FORBIDDEN),
    NOT_FOUND(HttpStatus.NOT_FOUND),
    EMAIL_ALREADY_REGISTERED(HttpStatus.CONFLICT),
    BOOKING_NO_AVAILABILITY(HttpStatus.CONFLICT),
    BOOKING_NOT_MODIFIABLE(HttpStatus.CONFLICT),
    TABLE_IN_USE(HttpStatus.CONFLICT),
    CURRENT_PASSWORD_INVALID(HttpStatus.UNPROCESSABLE_ENTITY),
    RESTAURANT_NOT_BOOKABLE(HttpStatus.UNPROCESSABLE_ENTITY),
    RESTAURANT_NOT_READY(HttpStatus.UNPROCESSABLE_ENTITY),
    BOOKING_SLOT_INVALID(HttpStatus.UNPROCESSABLE_ENTITY),
    BOOKING_OUTSIDE_HOURS(HttpStatus.UNPROCESSABLE_ENTITY),
    BOOKING_TOO_SOON(HttpStatus.UNPROCESSABLE_ENTITY),
    BOOKING_TOO_FAR(HttpStatus.UNPROCESSABLE_ENTITY),
    BOOKING_PARTY_SIZE(HttpStatus.UNPROCESSABLE_ENTITY),
    CONSENT_REQUIRED(HttpStatus.UNPROCESSABLE_ENTITY),
    IDEMPOTENCY_KEY_MISMATCH(HttpStatus.UNPROCESSABLE_ENTITY),
    RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS);

    private final HttpStatus httpStatus;

    ErrorCode(HttpStatus httpStatus) {
        this.httpStatus = httpStatus;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}
