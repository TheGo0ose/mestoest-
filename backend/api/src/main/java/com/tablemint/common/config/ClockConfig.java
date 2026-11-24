package com.tablemint.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

@Configuration
public class ClockConfig {

    public static final ZoneId BISHKEK_ZONE = ZoneId.of("Asia/Bishkek");

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
