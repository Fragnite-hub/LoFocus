# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy the pom.xml and source code
COPY pom.xml .
COPY src ./src

# Package the application (skip tests for faster build)
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy the packaged jar file from the build stage
COPY --from=build /app/target/*.jar app.jar

# Ensure port environment variable is respected (defaulting to 8081 if not set)
ENV PORT=8081
EXPOSE $PORT

# Create a volume for the H2 database data to persist between restarts if supported by host
VOLUME /app/data

# Run the jar file
ENTRYPOINT ["java", "-jar", "app.jar"]
