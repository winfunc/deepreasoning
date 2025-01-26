# Builder stage
FROM rust:latest as builder

WORKDIR /usr/src/deepclaude
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
COPY --from=builder /usr/src/deepclaude/target/release/deepclaude .
COPY --from=builder /usr/src/deepclaude/config.toml .

# Set the host and port in config
ENV DEEPCLAUDE_HOST=0.0.0.0
ENV DEEPCLAUDE_PORT=1337

# Expose port 1337
EXPOSE 1337

# Run the binary
CMD ["./deepclaude"]