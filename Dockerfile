# ==========================
# BUILD STAGE
# ==========================
FROM maven:3.9.5-eclipse-temurin-17 AS build

WORKDIR /app

# Copy pom.xml and download dependencies (layer caching)
COPY pom.xml .

RUN mvn dependency:go-offline -B

# Copy entire project
COPY . .

# Build Spring Boot project
RUN mvn clean package -DskipTests


# ==========================
# RUNTIME STAGE
# ==========================
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy built JAR
COPY --from=build /app/target/makemytrip-0.0.1-SNAPSHOT.jar app.jar

# Expose Spring Boot default port
EXPOSE 8080

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]
