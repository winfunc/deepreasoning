//! Client implementations for external AI model providers.
//!
//! This module contains client implementations for different AI model providers:
//! - `anthropic`: Client for Anthropic's Claude models
//! - `deepseek`: Client for DeepSeek's reasoning models
//!
//! Each client handles authentication, request building, and response parsing
//! specific to its provider's API.

pub mod anthropic;
pub mod deepseek;

pub use anthropic::AnthropicClient;
pub use deepseek::DeepSeekClient;

use crate::error::Result;
use reqwest::header::{HeaderMap, HeaderName, HeaderValue};
use std::collections::HashMap;

/// Converts a HashMap of string headers to a reqwest HeaderMap.
///
/// This function is used internally by clients to convert user-provided
/// header maps into the format required by reqwest.
///
/// # Arguments
///
/// * `headers` - A HashMap containing header names and values as strings
///
/// # Returns
///
/// * `Result<HeaderMap>` - The converted HeaderMap on success, or an error if
///   any header name or value is invalid
///
/// # Errors
///
/// Returns `ApiError::BadRequest` if:
/// - A header name contains invalid characters
/// - A header value contains invalid characters
pub(crate) fn build_headers(headers: &HashMap<String, String>) -> Result<HeaderMap> {
    let mut header_map = HeaderMap::new();
    
    for (key, value) in headers {
        let header_name = HeaderName::from_bytes(key.as_bytes())
            .map_err(|e| crate::error::ApiError::BadRequest { 
                message: format!("Invalid header name: {}", e) 
            })?;
            
        let header_value = HeaderValue::from_str(value)
            .map_err(|e| crate::error::ApiError::BadRequest { 
                message: format!("Invalid header value: {}", e) 
            })?;
            
        header_map.insert(header_name, header_value);
    }
    
    Ok(header_map)
}
