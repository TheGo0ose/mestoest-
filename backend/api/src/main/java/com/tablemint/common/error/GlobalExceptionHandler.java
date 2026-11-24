package com.tablemint.common.error;

import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.sql.SQLException;
import java.util.*;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private final MessageSource messageSource;

    public GlobalExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    @ExceptionHandler(DomainException.class)
    public ResponseEntity<Map<String, Object>> handleDomainException(DomainException ex) {
        ErrorCode code = ex.getErrorCode();
        Locale locale = resolveLocale();

        String title = messageSource.getMessage(
                code.name() + ".title",
                ex.getMessageArgs(),
                code.name(),
                locale
        );

        HttpHeaders headers = new HttpHeaders();
        if (code == ErrorCode.RATE_LIMITED && ex.getMessageArgs() != null && ex.getMessageArgs().length > 0) {
            headers.add(HttpHeaders.RETRY_AFTER, String.valueOf(ex.getMessageArgs()[0]));
        }

        Map<String, Object> body = buildProblemBody(code.getHttpStatus(), code.name(), title, null, null);
        return ResponseEntity.status(code.getHttpStatus())
                .headers(headers)
                .contentType(MediaType.parseMediaType("application/problem+json"))
                .body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException ex) {
        Locale locale = resolveLocale();
        ErrorCode code = ErrorCode.VALIDATION_FAILED;

        String title = messageSource.getMessage(
                code.name() + ".title",
                null,
                "Please check the highlighted fields.",
                locale
        );

        List<Map<String, String>> fieldErrors = new ArrayList<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            Map<String, String> item = new HashMap<>();
            item.put("field", fe.getField());
            item.put("message", fe.getDefaultMessage());
            fieldErrors.add(item);
        }

        Map<String, Object> body = buildProblemBody(code.getHttpStatus(), code.name(), title, null, fieldErrors);
        return ResponseEntity.status(code.getHttpStatus())
                .contentType(MediaType.parseMediaType("application/problem+json"))
                .body(body);
    }

    @ExceptionHandler({
            MissingRequestHeaderException.class,
            MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class,
            HttpMessageNotReadableException.class
    })
    public ResponseEntity<Map<String, Object>> handleBadRequestExceptions(Exception ex) {
        Locale locale = resolveLocale();
        ErrorCode code = ErrorCode.VALIDATION_FAILED;
        String title = messageSource.getMessage(
                code.name() + ".title",
                null,
                "Please check the highlighted fields.",
                locale
        );
        Map<String, Object> body = buildProblemBody(code.getHttpStatus(), code.name(), title, ex.getMessage(), null);
        return ResponseEntity.status(code.getHttpStatus())
                .contentType(MediaType.parseMediaType("application/problem+json"))
                .body(body);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        ErrorCode code = ErrorCode.FORBIDDEN;
        Locale locale = resolveLocale();
        String title = messageSource.getMessage(code.name() + ".title", null, "Access Denied", locale);

        Map<String, Object> body = buildProblemBody(code.getHttpStatus(), code.name(), title, null, null);
        return ResponseEntity.status(code.getHttpStatus())
                .contentType(MediaType.parseMediaType("application/problem+json"))
                .body(body);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleAuthenticationException(AuthenticationException ex) {
        ErrorCode code = ErrorCode.UNAUTHENTICATED;
        Locale locale = resolveLocale();
        String title = messageSource.getMessage(code.name() + ".title", null, "Unauthenticated", locale);

        Map<String, Object> body = buildProblemBody(code.getHttpStatus(), code.name(), title, null, null);
        return ResponseEntity.status(code.getHttpStatus())
                .contentType(MediaType.parseMediaType("application/problem+json"))
                .body(body);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex) {
        Throwable root = ex.getRootCause();
        Locale locale = resolveLocale();

        // Проверка на PostgreSQL SQLSTATE 23P01 (exclusion_violation - booking_no_overlap)
        if (root instanceof SQLException sqlEx) {
            String sqlState = sqlEx.getSQLState();
            if ("23P01".equals(sqlState) || (sqlEx.getMessage() != null && sqlEx.getMessage().contains("booking_no_overlap"))) {
                ErrorCode code = ErrorCode.BOOKING_NO_AVAILABILITY;
                String title = messageSource.getMessage(code.name() + ".title", null, "No free table at this time.", locale);
                Map<String, Object> body = buildProblemBody(code.getHttpStatus(), code.name(), title, null, null);
                return ResponseEntity.status(code.getHttpStatus())
                        .contentType(MediaType.parseMediaType("application/problem+json"))
                        .body(body);
            }
            if ("23505".equals(sqlState) && sqlEx.getMessage() != null && sqlEx.getMessage().contains("app_user_email")) {
                ErrorCode code = ErrorCode.EMAIL_ALREADY_REGISTERED;
                String title = messageSource.getMessage(code.name() + ".title", null, "Account exists.", locale);
                Map<String, Object> body = buildProblemBody(code.getHttpStatus(), code.name(), title, null, null);
                return ResponseEntity.status(code.getHttpStatus())
                        .contentType(MediaType.parseMediaType("application/problem+json"))
                        .body(body);
            }
        }

        // Общий fallback
        Map<String, Object> body = buildProblemBody(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "An unexpected database error occurred.", null, null);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.parseMediaType("application/problem+json"))
                .body(body);
    }

    private Locale resolveLocale() {
        Locale locale = LocaleContextHolder.getLocale();
        if (locale == null || (!"en".equalsIgnoreCase(locale.getLanguage()) && !"ru".equalsIgnoreCase(locale.getLanguage()))) {
            return Locale.forLanguageTag("ru");
        }
        return locale;
    }

    private Map<String, Object> buildProblemBody(HttpStatus status, String code, String title, String detail, List<Map<String, String>> fieldErrors) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("type", "about:blank");
        body.put("status", status.value());
        body.put("code", code);
        body.put("title", title);
        if (detail != null) {
            body.put("detail", detail);
        }
        if (fieldErrors != null && !fieldErrors.isEmpty()) {
            body.put("fieldErrors", fieldErrors);
        }
        return body;
    }
}
