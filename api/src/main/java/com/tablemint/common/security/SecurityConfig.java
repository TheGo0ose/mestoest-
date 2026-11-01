package com.tablemint.common.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final BotAuthenticationFilter botAuthenticationFilter;

    public SecurityConfig(BotAuthenticationFilter botAuthenticationFilter) {
        this.botAuthenticationFilter = botAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        .ignoringRequestMatchers("/guest/**", "/actuator/**") // Stateless bot and health actuator
                )
                .authorizeHttpRequests(auth -> auth
                        // Public Catalog and Auth
                        .requestMatchers(HttpMethod.POST, "/auth/register", "/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/restaurants/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/restaurants/*/contact-requests").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()

                        // Telegram Bot endpoints
                        .requestMatchers("/guest/**").hasRole("BOT")

                        // Moderator only endpoints
                        .requestMatchers("/admin/users/**", "/admin/owners/**").hasRole("MODERATOR")
                        .requestMatchers(HttpMethod.POST, "/admin/restaurants").hasRole("MODERATOR")

                        // Admin / Owner endpoints
                        .requestMatchers("/admin/**").hasAnyRole("OWNER", "MODERATOR")

                        // Customer Bookings
                        .requestMatchers("/bookings/**", "/me/**").hasAnyRole("CUSTOMER", "OWNER", "MODERATOR")

                        // Authenticated users for auth details
                        .requestMatchers("/auth/me", "/auth/logout", "/auth/password").authenticated()

                        .anyRequest().authenticated()
                )
                .addFilterBefore(botAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }
}
