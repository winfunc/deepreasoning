//! DeepSeek API client implementation for interacting with DeepSeek's AI models.
//!
//! This module provides a client implementation for making requests to DeepSeek's chat completion API.
//! It supports both streaming and non-streaming interactions, handling authentication, request
//! construction, and response parsing.
//!
//! # Features
//!
//! - Supports chat completions with DeepSeek's AI models
//! - Handles both streaming and non-streaming responses
//! - Configurable request parameters (model, max tokens, temperature)
//! - Custom header support
//! - Comprehensive error handling
//!
//! # Examples
//!
//! ```no_run
//! use crate::{
//!     clients::DeepSeekClient,
//!     models::{ApiConfig, Message},
//! };
//!
//! # async fn example() -> Result<(), Box<dyn std::error::Error>> {
//! // Initialize the client
//! let client = DeepSeekClient::new("your-api-key".to_string());
//!
//! // Prepare messages and configuration
//! let messages = vec![Message {
//!     role: "user".to_string(),
//!     content: "Hello, how are you?".to_string(),
//! }];
//!
//! let config = ApiConfig::default();
//!
//! // Make a non-streaming request
//! let response = client.chat(messages.clone(), &config).await?;
//!
//! // Or use streaming for real-time responses
//! let mut stream = client.chat_stream(messages, &config);
//! while let Some(chunk) = stream.next().await {
//!     println!("Received chunk: {:?}", chunk?);
//! }
//! # Ok(())
//! # }
//! ```
//!
//! # Error Handling
//!
//! The client uses a custom error type `ApiError` to handle various failure cases:
//! - Network errors
//! - API authentication errors
//! - Invalid response formats
//! - Stream processing errors
//!
//! All public methods return `Result` types with appropriate error variants.

use crate::{
    error::{ApiError, Result},
    models::{ApiConfig, Message},
};
use futures::Stream;
use reqwest::{header::HeaderMap, Client};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, pin::Pin};
use futures::StreamExt;
use serde_json;

pub(crate) const DEEPSEEK_API_URL: &str = "https://api.deepseek.com/chat/completions";
const DEFAULT_MODEL: &str = "deepseek-reasoner";

/// Client for interacting with DeepSeek's AI models.
///
/// This client handles authentication, request construction, and response parsing
/// for both streaming and non-streaming interactions with DeepSeek's API.
///
/// # Examples
///
/// ```no_run
/// use deepclaude::clients::DeepSeekClient;
///
/// let client = DeepSeekClient::new("api_token".to_string());
/// ```
#[derive(Debug)]
pub struct DeepSeekClient {
    pub(crate) client: Client,
    api_token: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct DeepSeekResponse {
    pub id: String,
    pub object: String,
    pub created: i64,
    pub model: String,
    pub choices: Vec<Choice>,
    pub usage: Usage,
    pub system_fingerprint: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Choice {
    pub index: i32,
    pub message: AssistantMessage,
    pub logprobs: Option<serde_json::Value>,
    pub finish_reason: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct AssistantMessage {
    pub role: String,
    pub content: Option<String>,
    pub reasoning_content: Option<String>,
}

// Streaming response types
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct StreamChoice {
    pub index: i32,
    pub delta: StreamDelta,
    pub logprobs: Option<serde_json::Value>,
    pub finish_reason: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct StreamDelta {
    pub role: Option<String>,
    pub content: Option<String>,
    pub reasoning_content: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct StreamResponse {
    pub id: String,
    pub object: String,
    pub created: i64,
    pub model: String,
    pub choices: Vec<StreamChoice>,
    pub usage: Option<Usage>,
    pub system_fingerprint: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Usage {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
    pub prompt_tokens_details: PromptTokensDetails,
    pub completion_tokens_details: CompletionTokensDetails,
    pub prompt_cache_hit_tokens: u32,
    pub prompt_cache_miss_tokens: u32,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct PromptTokensDetails {
    pub cached_tokens: u32,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct CompletionTokensDetails {
    pub reasoning_tokens: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct DeepSeekRequest {
    messages: Vec<Message>,
    stream: bool,
    #[serde(flatten)]
    additional_params: serde_json::Value,
}

impl DeepSeekClient {
    pub fn new(api_token: String) -> Self {
        Self {
            client: Client::new(),
            api_token,
        }
    }

    /// Builds the HTTP headers required for DeepSeek API requests.
    ///
    /// # Arguments
    ///
    /// * `custom_headers` - Optional additional headers to include in requests
    ///
    /// # Returns
    ///
    /// * `Result<HeaderMap>` - The constructed headers on success, or an error if header construction fails
    ///
    /// # Errors
    ///
    /// Returns `ApiError::Internal` if:
    /// - The API token is invalid
    /// - Content-Type or Accept headers cannot be constructed
    pub(crate) fn build_headers(&self, custom_headers: Option<&HashMap<String, String>>) -> Result<HeaderMap> {
        let mut headers = HeaderMap::new();
        headers.insert(
            "Authorization",
            format!("Bearer {}", self.api_token)
                .parse()
                .map_err(|e| ApiError::Internal { 
                    message: format!("Invalid API token: {}", e) 
                })?,
        );
        headers.insert(
            "Content-Type",
            "application/json"
                .parse()
                .map_err(|e| ApiError::Internal { 
                    message: format!("Invalid content type: {}", e) 
                })?,
        );
        headers.insert(
            "Accept",
            "application/json"
                .parse()
                .map_err(|e| ApiError::Internal { 
                    message: format!("Invalid accept header: {}", e) 
                })?,
        );

        if let Some(custom) = custom_headers {
            headers.extend(super::build_headers(custom)?);
        }

        Ok(headers)
    }

    /// Constructs a request object for the DeepSeek API.
    ///
    /// # Arguments
    ///
    /// * `messages` - Vector of messages to send to the model
    /// * `stream` - Whether to enable streaming mode
    /// * `config` - Configuration options for the request
    ///
    /// # Returns
    ///
    /// A `DeepSeekRequest` object configured with the provided parameters and defaults
    pub(crate) fn build_request(&self, messages: Vec<Message>, stream: bool, config: &ApiConfig) -> DeepSeekRequest {
        // Create a base request with required fields
        let mut request_value = serde_json::json!({
            "messages": messages,
            "stream": stream,
            // Set defaults only if not provided in config
            "model": config.body.get("model").unwrap_or(&serde_json::json!(DEFAULT_MODEL)),
            "max_tokens": config.body.get("max_tokens").unwrap_or(&serde_json::json!(8192)),
            "temperature": config.body.get("temperature").unwrap_or(&serde_json::json!(1.0)),
            "response_format": {
                "type": "text"
            }
        });

        // Merge additional configuration from config.body while protecting critical fields
        if let serde_json::Value::Object(mut map) = request_value {
            if let serde_json::Value::Object(mut body) = serde_json::to_value(&config.body).unwrap_or_default() {
                // Remove protected fields from config body
                body.remove("stream");
                body.remove("messages");
                
                // Merge remaining fields from config.body
                for (key, value) in body {
                    map.insert(key, value);
                }
            }
            request_value = serde_json::Value::Object(map);
        }

        // Convert the merged JSON value into our request structure
        serde_json::from_value(request_value).unwrap_or_else(|_| DeepSeekRequest {
            messages,
            stream,
            additional_params: config.body.clone(),
        })
    }

    /// Sends a non-streaming chat request to the DeepSeek API.
    ///
    /// # Arguments
    ///
    /// * `messages` - Vector of messages for the conversation
    /// * `config` - Configuration options for the request
    ///
    /// # Returns
    ///
    /// * `Result<DeepSeekResponse>` - The model's response on success
    ///
    /// # Errors
    ///
    /// Returns `ApiError::DeepSeekError` if:
    /// - The API request fails
    /// - The response status is not successful
    /// - The response cannot be parsed
    pub async fn chat(
        &self,
        messages: Vec<Message>,
        config: &ApiConfig,
    ) -> Result<DeepSeekResponse> {
        let headers = self.build_headers(Some(&config.headers))?;
        let request = self.build_request(messages, false, config);

        let response = self
            .client
            .post(DEEPSEEK_API_URL)
            .headers(headers)
            .json(&request)
            .send()
            .await
            .map_err(|e| ApiError::DeepSeekError { 
                message: format!("Request failed: {}", e),
                type_: "request_failed".to_string(),
                param: None,
                code: None
            })?;

        if !response.status().is_success() {
            let error = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(ApiError::DeepSeekError { 
                message: error,
                type_: "api_error".to_string(),
                param: None,
                code: None
            });
        }

        response
            .json::<DeepSeekResponse>()
            .await
            .map_err(|e| ApiError::DeepSeekError { 
                message: format!("Failed to parse response: {}", e),
                type_: "parse_error".to_string(),
                param: None,
                code: None
            })
    }

    /// Sends a streaming chat request to the DeepSeek API.
    ///
    /// Returns a stream that yields chunks of the model's response as they arrive.
    ///
    /// # Arguments
    ///
    /// * `messages` - Vector of messages for the conversation
    /// * `config` - Configuration options for the request
    ///
    /// # Returns
    ///
    /// * `Pin<Box<dyn Stream<Item = Result<StreamResponse>> + Send>>` - A stream of response chunks
    ///
    /// # Errors
    ///
    /// The stream may yield `ApiError::DeepSeekError` if:
    /// - The API request fails
    /// - Stream processing encounters an error
    /// - Response chunks cannot be parsed
    pub fn chat_stream(
        &self,
        messages: Vec<Message>,
        config: &ApiConfig,
    ) -> Pin<Box<dyn Stream<Item = Result<StreamResponse>> + Send>> {
        let headers = match self.build_headers(Some(&config.headers)) {
            Ok(h) => h,
            Err(e) => return Box::pin(futures::stream::once(async move { Err(e) })),
        };

        let request = self.build_request(messages, true, config);
        let client = self.client.clone();

        Box::pin(async_stream::try_stream! {
            let mut stream = client
                .post(DEEPSEEK_API_URL)
                .headers(headers)
                .json(&request)
                .send()
                .await
                .map_err(|e| ApiError::DeepSeekError { 
                    message: format!("Request failed: {}", e),
                    type_: "request_failed".to_string(),
                    param: None,
                    code: None
                })?
                .bytes_stream();

            let mut data = String::new();
            
            while let Some(chunk) = stream.next().await {
                let chunk = chunk.map_err(|e| ApiError::DeepSeekError { 
                    message: format!("Stream error: {}", e),
                    type_: "stream_error".to_string(),
                    param: None,
                    code: None
                })?;
                data.push_str(&String::from_utf8_lossy(&chunk));

                let mut start = 0;
                while let Some(end) = data[start..].find("\n\n") {
                    let end = start + end;
                    let line = &data[start..end].trim();
                    start = end + 2;
                    
                    if line.starts_with("data: ") {
                        let json_data = &line["data: ".len()..];
                        if let Ok(response) = serde_json::from_str::<StreamResponse>(json_data) {
                            yield response;
                        }
                    }
                }

                if start > 0 {
                    data = data[start..].to_string();
                }
            }
        })
    }
}
