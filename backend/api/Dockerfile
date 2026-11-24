# Multi-stage Dockerfile for TableMint Spring Boot API
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace
COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./
COPY src src
RUN chmod +x ./gradlew && ./gradlew bootJar --no-daemon -x test

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
COPY --from=builder /workspace/build/libs/tablemint-api-*.jar app.jar
ENV JAVA_TOOL_OPTIONS="-Xmx768m"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
