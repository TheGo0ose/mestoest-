package com.tablemint.common.error;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Locale;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();
        messageSource.setBasename("messages");
        messageSource.setDefaultEncoding("UTF-8");
        messageSource.setDefaultLocale(Locale.forLanguageTag("ru"));
        exceptionHandler = new GlobalExceptionHandler(messageSource);
    }

    @Test
    @DisplayName("DomainException should map to RFC 9457 ProblemDetail with correct HTTP status and localized message")
    void shouldHandleDomainException() {
        DomainException ex = new DomainException(ErrorCode.BOOKING_NO_AVAILABILITY);

        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleDomainException(ex);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("BOOKING_NO_AVAILABILITY", response.getBody().get("code"));
        assertEquals(409, response.getBody().get("status"));
        assertEquals("На это время нет свободных столиков. Выберите другое время.", response.getBody().get("title"));
    }
}
