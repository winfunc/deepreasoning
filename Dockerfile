# Builder stage
FROM rust:latest as builder

WORKDIR /usr/src/deepreasoning
COPY . .

# Install build dependencies
RUN apt-get update && \
    apt-get install -y pkg-config libssl-dev && \
    rm -rf /var/lib/apt/lists/*

# Build the application
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

WORKDIR /usr/local/bin

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y libssl3 ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy the built binary
COPY --from=builder /usr/src/deepreasoning/target/release/deepreasoning .
COPY --from=builder /usr/src/deepreasoning/config.toml .

# Set the host and port in config
ENV DEEPREASONING_HOST=0.0.0.0
ENV DEEPREASONING_PORT=1337

# Expose port 1337
EXPOSE 1337

# Run the binary
CMD ["./deepreasoning"]