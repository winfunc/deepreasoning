//! Configuration management for the application.
//!
//! This module handles loading and managing configuration settings from files
//! and environment variables. It includes pricing configurations for different
//! AI model providers and server settings.

use serde::{Deserialize, Serialize};
use std::path::Path;

/// Root configuration structure containing all application settings.
///
/// This structure is typically loaded from a TOML configuration file
/// and provides access to all configurable aspects of the application.
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Config {
    pub server: ServerConfig,
    pub pricing: PricingConfig,
}

/// Server-specific configuration settings.
///
/// Contains settings related to the HTTP server, such as the
/// host address and port number to bind to.
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
}

/// Pricing configuration for all supported AI models.
///
/// Contains pricing information for different AI model providers
/// and their various models, used for usage cost calculation.
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct PricingConfig {
    pub deepseek: DeepSeekPricing,
    pub anthropic: AnthropicPricing,
}

/// DeepSeek-specific pricing configuration.
///
/// Contains pricing rates for different aspects of DeepSeek API usage,
/// including cached and non-cached requests.
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct DeepSeekPricing {
    pub input_cache_hit_price: f64,   // per million tokens
    pub input_cache_miss_price: f64,  // per million tokens
    pub output_price: f64,            // per million tokens
}

/// Anthropic-specific pricing configuration.
///
/// Contains pricing information for different Claude model variants
/// and their associated costs.
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct AnthropicPricing {
    pub claude_3_sonnet: ModelPricing,
    pub claude_3_haiku: ModelPricing,
    pub claude_3_opus: ModelPricing,
}

/// Generic model pricing configuration.
///
/// Contains detailed pricing information for a specific model,
/// including input, output, and caching costs.
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ModelPricing {
    pub input_price: f64,             // per million tokens
    pub output_price: f64,            // per million tokens
    pub cache_write_price: f64,       // per million tokens
    pub cache_read_price: f64,        // per million tokens
}

impl Config {
    /// Loads configuration from the default config file.
    ///
    /// Attempts to load and parse the configuration from 'config.toml'.
    /// Falls back to default values if the file cannot be loaded or parsed.
    ///
    /// # Returns
    ///
    /// * `anyhow::Result<Self>` - The loaded configuration or an error if loading fails
    ///
    /// # Errors
    ///
    /// Returns an error if:
    /// - The config file cannot be read
    /// - The TOML content cannot be parsed
    /// - The parsed content doesn't match the expected structure
    pub fn load() -> anyhow::Result<Self> {
        let config_path = Path::new("config.toml");
        let config = config::Config::builder()
            .add_source(config::File::from(config_path))
            .build()?;

        Ok(config.try_deserialize()?)
    }
}

/// Provides default configuration values.
///
/// These defaults are used when a configuration file is not present
/// or when specific values are not provided in the config file.
impl Default for Config {
    fn default() -> Self {
        Self {
            server: ServerConfig {
                host: "127.0.0.1".to_string(),
                port: 3000,
            },
            pricing: PricingConfig {
                deepseek: DeepSeekPricing {
                    input_cache_hit_price: 0.14,
                    input_cache_miss_price: 0.55,
                    output_price: 2.19,
                },
                anthropic: AnthropicPricing {
                    claude_3_sonnet: ModelPricing {
                        input_price: 3.0,
                        output_price: 15.0,
                        cache_write_price: 3.75,
                        cache_read_price: 0.30,
                    },
                    claude_3_haiku: ModelPricing {
                        input_price: 0.80,
                        output_price: 4.0,
                        cache_write_price: 1.0,
                        cache_read_price: 0.08,
                    },
                    claude_3_opus: ModelPricing {
                        input_price: 15.0,
                        output_price: 75.0,
                        cache_write_price: 18.75,
                        cache_read_price: 1.50,
                    },
                },
            },
        }
    }
}
