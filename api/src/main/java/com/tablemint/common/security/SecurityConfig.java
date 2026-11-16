package com.tablemint.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tablemint.common.error.ErrorCode;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final BotAuthenticationFilter botAuthenticationFilter;
    private final MessageSource messageSource;
    private final ObjectMapper objectMapper;

    public SecurityConfig(
            BotAuthenticationFilter botAuthenticationFilter,
            MessageSource messageSource,
            ObjectMapper objectMapper
    ) {
        this.botAuthenticationFilter = botAuthenticationFilter;
        this.messageSource = messageSource;
        this.objectMapper = objectMapper;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                        .ignoringRequestMatchers(
                                "/auth/**", "/api/v1/auth/**",
                                "/guest/**", "/api/v1/guest/**",
                                "/restaurants/*/contact-requests", "/api/v1/restaurants/*/contact-requests",
                                "/actuator/**"
                        )
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            ErrorCode code = ErrorCode.UNAUTHENTICATED;
                            Locale locale = resolveLocale();
                            String title = messageSource.getMessage(code.name() + ".title", null, "Please sign in to continue.", locale);
                            writeProblemJson(response, code, title);
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            ErrorCode code = ErrorCode.FORBIDDEN;
                            Locale locale = resolveLocale();
                            String title = messageSource.getMessage(code.name() + ".title", null, "Access Denied", locale);
                            writeProblemJson(response, code, title);
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        // Public UI, Catalog and Auth
                        .requestMatchers("/", "/index.html", "/login", "/login.html", "/favicon.ico").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/register", "/auth/login", "/api/v1/auth/register", "/api/v1/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/restaurants/**", "/api/v1/restaurants/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/restaurants/*/contact-requests", "/api/v1/restaurants/*/contact-requests").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()

                        // Telegram Bot endpoints
                        .requestMatchers("/guest/**", "/api/v1/guest/**").hasRole("BOT")

                        // Moderator only endpoints
                        .requestMatchers("/admin/users/**", "/admin/owners/**", "/api/v1/admin/users/**", "/api/v1/admin/owners/**").hasRole("MODERATOR")
                        .requestMatchers(HttpMethod.POST, "/admin/restaurants", "/api/v1/admin/restaurants").hasRole("MODERATOR")

                        // Admin / Owner endpoints
                        .requestMatchers("/admin/**", "/api/v1/admin/**").hasAnyRole("OWNER", "MODERATOR")

                        // Customer Bookings
                        .requestMatchers("/bookings/**", "/me/**", "/api/v1/bookings/**", "/api/v1/me/**").hasAnyRole("CUSTOMER", "OWNER", "MODERATOR")

                        // Authenticated users for auth details
                        .requestMatchers("/auth/me", "/auth/logout", "/auth/password", "/api/v1/auth/me", "/api/v1/auth/logout", "/api/v1/auth/password").authenticated()

                        .anyRequest().authenticated()
                )
                .addFilterBefore(botAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private Locale resolveLocale() {
        Locale locale = LocaleContextHolder.getLocale();
        if (locale == null || (!"en".equalsIgnoreCase(locale.getLanguage()) && !"ru".equalsIgnoreCase(locale.getLanguage()))) {
            return Locale.forLanguageTag("ru");
        }
        return locale;
    }

    private void writeProblemJson(jakarta.servlet.http.HttpServletResponse response, ErrorCode code, String title) throws java.io.IOException {
        response.setStatus(code.getHttpStatus().value());
        response.setContentType("application/problem+json");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("type", "about:blank");
        body.put("status", code.getHttpStatus().value());
        body.put("code", code.name());
        body.put("title", title);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
