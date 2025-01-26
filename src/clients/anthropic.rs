//! Anthropic API client implementation for interacting with Claude models.
//!
//! This module provides a client implementation for communicating with Anthropic's API,
//! specifically designed to work with Claude language models. It supports both streaming
//! and non-streaming interactions, handling all aspects of API communication including:
//!
//! - Authentication and request signing
//! - Message formatting and serialization
//! - Response parsing and deserialization
//! - Error handling and type conversion
//! - Streaming response processing
//!
//! # Main Components
//!
//! - [`AnthropicClient`]: The main client struct for making API requests
//! - [`AnthropicResponse`]: Represents the structured response from the API
//! - [`StreamEvent`]: Represents different types of events in streaming responses
//!
//! # Example Usage
//!
//! ```no_run
//! use deepclaude::clients::AnthropicClient;
//! use deepclaude::models::{Message, ApiConfig};
//!
//! async fn example() -> Result<(), Box<dyn std::error::Error>> {
//!     let client = AnthropicClient::new("your-api-key".to_string());
//!     let messages = vec![/* your messages */];
//!     let config = ApiConfig::default();
//!
//!     // Non-streaming request
//!     let response = client.chat(messages.clone(), None, &config).await?;
//!
//!     // Streaming request
//!     let stream = client.chat_stream(messages, None, &config);
//!     Ok(())
//! }
//! ```

use crate::{
    error::{ApiError, Result},
    models::{ApiConfig, Message, Role},
};
use futures::Stream;
use reqwest::{header::HeaderMap, Client};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, pin::Pin};
use futures::StreamExt;
use serde_json;

pub(crate) const ANTHROPIC_API_URL: &str = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL: &str = "claude-3-5-sonnet-20241022";

/// Client for interacting with Anthropic's Claude models.
///
/// This client handles authentication, request construction, and response parsing
/// for both streaming and non-streaming interactions with Anthropic's API.
///
/// # Examples
///
/// ```no_run
/// use deepclaude::clients::AnthropicClient;
///
/// let client = AnthropicClient::new("api_token".to_string());
/// ```
#[derive(Debug)]
pub struct AnthropicClient {
    pub(crate) client: Client,
    api_token: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct AnthropicResponse {
    pub id: String,
    #[serde(rename = "type")]
    pub response_type: String,
    pub role: String,
    pub model: String,
    pub content: Vec<ContentBlock>,
    pub stop_reason: Option<String>,
    pub stop_sequence: Option<String>,
    pub usage: Usage,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ContentBlock {
    #[serde(rename = "type")]
    pub content_type: String,
    pub text: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Usage {
    pub input_tokens: u32,
    pub output_tokens: u32,
    pub cache_creation_input_tokens: u32,
    pub cache_read_input_tokens: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct AnthropicRequest {
    messages: Vec<AnthropicMessage>,
    stream: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    system: Option<String>,
    #[serde(flatten)]
    additional_params: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct AnthropicMessage {
    role: String,
    content: String,
}

// Event types for streaming responses
#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
pub enum StreamEvent {
    #[serde(rename = "message_start")]
    MessageStart {
        message: AnthropicResponse,
    },
    #[serde(rename = "content_block_start")]
    #[allow(dead_code)]
    ContentBlockStart {
        index: usize,
        content_block: ContentBlock,
    },
    #[serde(rename = "content_block_delta")]
    #[allow(dead_code)]
    ContentBlockDelta {
        index: usize,
        delta: ContentDelta,
    },
    #[serde(rename = "content_block_stop")]
    #[allow(dead_code)]
    ContentBlockStop {
        index: usize,
    },
    #[serde(rename = "message_delta")]
    #[allow(dead_code)]
    MessageDelta {
        delta: MessageDelta,
        usage: Option<Usage>,
    },
    #[serde(rename = "message_stop")]
    MessageStop,
    #[serde(rename = "ping")]
    Ping,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ContentDelta {
    #[serde(rename = "type")]
    pub delta_type: String,
    pub text: String,
}

#[derive(Debug, Deserialize, Clone)]
#[allow(dead_code)]
pub struct MessageDelta {
    pub stop_reason: Option<String>,
    pub stop_sequence: Option<String>,
}

impl AnthropicClient {
    /// Creates a new Anthropic client instance.
    ///
    /// # Arguments
    ///
    /// * `api_token` - API token for authentication with Anthropic's API
    ///
    /// # Returns
    ///
    /// A new `AnthropicClient` instance configured with the provided API token
    pub fn new(api_token: String) -> Self {
        Self {
            client: Client::new(),
            api_token,
        }
    }

    /// Builds the HTTP headers required for Anthropic API requests.
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
    /// - Content-Type or Anthropic-Version headers cannot be constructed
    pub(crate) fn build_headers(&self, custom_headers: Option<&HashMap<String, String>>) -> Result<HeaderMap> {
        let mut headers = HeaderMap::new();
        headers.insert(
            "x-api-key",
            self.api_token
                .parse()
                .map_err(|e| ApiError::Internal { 
                    message: format!("Invalid API token: {}", e) 
                })?,
        );
        headers.insert(
            "content-type",
            "application/json"
                .parse()
                .map_err(|e| ApiError::Internal { 
                    message: format!("Invalid content type: {}", e) 
                })?,
        );
        headers.insert(
            "anthropic-version",
            "2023-06-01"
                .parse()
                .map_err(|e| ApiError::Internal { 
                    message: format!("Invalid anthropic version: {}", e) 
                })?,
        );

        if let Some(custom) = custom_headers {
            headers.extend(super::build_headers(custom)?);
        }

        Ok(headers)
    }

    /// Constructs a request object for the Anthropic API.
    ///
    /// # Arguments
    ///
    /// * `messages` - Vector of messages to send to the model
    /// * `system` - Optional system prompt to set context
    /// * `stream` - Whether to enable streaming mode
    /// * `config` - Configuration options for the request
    ///
    /// # Returns
    ///
    /// An `AnthropicRequest` object configured with the provided parameters and defaults
    pub(crate) fn build_request(
        &self,
        messages: Vec<Message>,
        system: Option<String>,
        stream: bool,
        config: &ApiConfig,
    ) -> AnthropicRequest {
        let filtered_messages = messages
            .into_iter()
            .filter(|msg| msg.role != Role::System)
            .map(|msg| AnthropicMessage {
                role: match msg.role {
                    Role::User => "user".to_string(),
                    Role::Assistant => "assistant".to_string(),
                    Role::System => unreachable!(),
                },
                content: msg.content,
            })
            .collect();

        // Create base request with required fields
        let default_model = serde_json::json!(DEFAULT_MODEL);
        let model_value = config.body.get("model").unwrap_or(&default_model);
        let default_max_tokens = if let Some(model_str) = model_value.as_str() {
            if model_str.contains("claude-3-opus") {
                4096
            } else {
                8192
            }
        } else {
            8192
        };
        let default_max_tokens_json = serde_json::json!(default_max_tokens);

        let mut request_value = serde_json::json!({
            "messages": filtered_messages,
            "stream": stream,
            "model": model_value,
            "max_tokens": config.body.get("max_tokens").unwrap_or(&default_max_tokens_json)
        });

        // Add system if present
        if let Some(ref sys) = system {
            if let serde_json::Value::Object(mut map) = request_value {
                map.insert("system".to_string(), serde_json::json!(sys));
                request_value = serde_json::Value::Object(map);
            }
        }

        // Merge additional configuration from config.body while protecting critical fields
        if let serde_json::Value::Object(mut map) = request_value {
            if let serde_json::Value::Object(mut body) = serde_json::to_value(&config.body).unwrap_or_default() {
                // Remove protected fields from config body
                body.remove("stream");
                body.remove("messages");
                body.remove("system");
                
                // Merge remaining fields from config.body
                for (key, value) in body {
                    map.insert(key, value);
                }
            }
            request_value = serde_json::Value::Object(map);
        }

        // Convert the merged JSON value into our request structure
        serde_json::from_value(request_value).unwrap_or_else(|_| AnthropicRequest {
            messages: filtered_messages,
            stream,
            system,
            additional_params: config.body.clone(),
        })
    }

    /// Sends a non-streaming chat request to the Anthropic API.
    ///
    /// # Arguments
    ///
    /// * `messages` - Vector of messages for the conversation
    /// * `system` - Optional system prompt to set context
    /// * `config` - Configuration options for the request
    ///
    /// # Returns
    ///
    /// * `Result<AnthropicResponse>` - The model's response on success
    ///
    /// # Errors
    ///
    /// Returns `ApiError::AnthropicError` if:
    /// - The API request fails
    /// - The response status is not successful
    /// - The response cannot be parsed
    pub async fn chat(
        &self,
        messages: Vec<Message>,
        system: Option<String>,
        config: &ApiConfig,
    ) -> Result<AnthropicResponse> {
        let headers = self.build_headers(Some(&config.headers))?;
        let request = self.build_request(messages, system, false, config);

        let response = self
            .client
            .post(ANTHROPIC_API_URL)
            .headers(headers)
            .json(&request)
            .send()
            .await
            .map_err(|e| ApiError::AnthropicError { 
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
            return Err(ApiError::AnthropicError { 
                message: error,
                type_: "api_error".to_string(),
                param: None,
                code: None
            });
        }

        response
            .json::<AnthropicResponse>()
            .await
            .map_err(|e| ApiError::AnthropicError { 
                message: format!("Failed to parse response: {}", e),
                type_: "parse_error".to_string(),
                param: None,
                code: None
            })
    }

    /// Sends a streaming chat request to the Anthropic API.
    ///
    /// Returns a stream that yields events from the model's response as they arrive.
    ///
    /// # Arguments
    ///
    /// * `messages` - Vector of messages for the conversation
    /// * `system` - Optional system prompt to set context
    /// * `config` - Configuration options for the request
    ///
    /// # Returns
    ///
    /// * `Pin<Box<dyn Stream<Item = Result<StreamEvent>> + Send>>` - A stream of response events
    ///
    /// # Errors
    ///
    /// The stream may yield `ApiError::AnthropicError` if:
    /// - The API request fails
    /// - Stream processing encounters an error
    /// - Response events cannot be parsed
    pub fn chat_stream(
        &self,
        messages: Vec<Message>,
        system: Option<String>,
        config: &ApiConfig,
    ) -> Pin<Box<dyn Stream<Item = Result<StreamEvent>> + Send>> {
        let headers = match self.build_headers(Some(&config.headers)) {
            Ok(h) => h,
            Err(e) => return Box::pin(futures::stream::once(async move { Err(e) })),
        };

        let request = self.build_request(messages, system, true, config);
        let client = self.client.clone();

        Box::pin(async_stream::try_stream! {
            let mut stream = client
                .post(ANTHROPIC_API_URL)
                .headers(headers)
                .json(&request)
                .send()
                .await
                .map_err(|e| ApiError::AnthropicError { 
                    message: format!("Request failed: {}", e),
                    type_: "request_failed".to_string(),
                    param: None,
                    code: None
                })?
                .bytes_stream();

            let mut data = String::new();
            
            while let Some(chunk) = stream.next().await {
                let chunk = chunk.map_err(|e| ApiError::AnthropicError { 
                    message: format!("Stream error: {}", e),
                    type_: "stream_error".to_string(),
                    param: None,
                    code: None
                })?;
                data.push_str(&String::from_utf8_lossy(&chunk));

                let mut start = 0;
                while let Some(end) = data[start..].find("\n\n") {
                    let end = start + end;
                    let event_data = &data[start..end];
                    start = end + 2;

                    if event_data.starts_with("event: ") {
                        let _event_line = &event_data["event: ".len()..];
                        if let Some(data_line) = event_data.lines().nth(1) {
                            if data_line.starts_with("data: ") {
                                let json_data = &data_line["data: ".len()..];
                                if let Ok(event) = serde_json::from_str::<StreamEvent>(json_data) {
                                    yield event;
                                }
                            }
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

/// Converts an Anthropic content block into the application's generic content block type.
impl From<ContentBlock> for crate::models::response::ContentBlock {
    fn from(block: ContentBlock) -> Self {
        Self {
            content_type: block.content_type,
            text: block.text,
        }
    }
}
