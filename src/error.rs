//! Error handling types and implementations for the application.
//!
//! This module provides a comprehensive error handling system including:
//! - Custom error types for various failure scenarios
//! - Conversion implementations for common error types
//! - Response formatting for API errors
//! - Type aliases for common Result types

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response, sse::Event},
    Json,
};
use serde::{Deserialize, Serialize};
use std::convert::Infallible;
use thiserror::Error;
use tokio_stream::wrappers::ReceiverStream;

/// Response structure for API errors.
///
/// This structure provides a consistent format for error responses
/// returned by the API endpoints.
#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorResponse {
    pub error: ErrorDetails,
}

/// Detailed error information included in error responses.
///
/// Contains specific information about what went wrong, including:
/// - A human-readable error message
/// - The type of error that occurred
/// - Optional parameter that caused the error
/// - Optional error code for more specific error handling
#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorDetails {
    pub message: String,
    #[serde(rename = "type")]
    pub type_: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub param: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code: Option<String>,
}

/// Enumeration of all possible API errors.
///
/// This enum represents all the different types of errors that can occur
/// during API operations, including validation errors, external API errors,
/// and internal server errors.
#[derive(Error, Debug, Clone)]
pub enum ApiError {
    #[error("Invalid request: {message}")]
    BadRequest {
        message: String,
    },

    #[error("Missing required header: {header}")]
    MissingHeader {
        header: String,
    },

    #[error("Invalid system prompt configuration")]
    InvalidSystemPrompt,

    #[error("DeepSeek API error: {message}")]
    DeepSeekError {
        message: String,
        type_: String,
        param: Option<String>,
        code: Option<String>,
    },

    #[error("Anthropic API error: {message}")]
    AnthropicError {
        message: String,
        type_: String,
        param: Option<String>,
        code: Option<String>,
    },

    #[error("Internal server error: {message}")]
    Internal {
        message: String,
    },

    #[error("Other error: {message}")]
    Other {
        message: String,
    },
}

/// Implements conversion of API errors into HTTP responses.
///
/// Maps each error variant to an appropriate HTTP status code and
/// formats the error details into a consistent JSON response structure.
impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, error_response) = match &self {
            ApiError::BadRequest { message } => (
                StatusCode::BAD_REQUEST,
                ErrorResponse {
                    error: ErrorDetails {
                        message: message.clone(),
                        type_: "bad_request".to_string(),
                        param: None,
                        code: None,
                    },
                },
            ),
            ApiError::MissingHeader { header } => (
                StatusCode::BAD_REQUEST,
                ErrorResponse {
                    error: ErrorDetails {
                        message: format!("Missing required header: {}", header),
                        type_: "missing_header".to_string(),
                        param: Some(header.clone()),
                        code: None,
                    },
                },
            ),
            ApiError::InvalidSystemPrompt => (
                StatusCode::BAD_REQUEST,
                ErrorResponse {
                    error: ErrorDetails {
                        message: "System prompt can only be provided once, either in root or messages array".to_string(),
                        type_: "invalid_system_prompt".to_string(),
                        param: None,
                        code: None,
                    },
                },
            ),
            ApiError::DeepSeekError { message, type_, param, code } => (
                StatusCode::BAD_REQUEST,
                ErrorResponse {
                    error: ErrorDetails {
                        message: format!("DeepSeek API Error: {}", message),
                        type_: format!("deepseek_{}", type_),
                        param: param.clone(),
                        code: code.clone(),
                    },
                },
            ),
            ApiError::AnthropicError { message, type_, param, code } => (
                StatusCode::BAD_REQUEST,
                ErrorResponse {
                    error: ErrorDetails {
                        message: format!("Anthropic API Error: {}", message),
                        type_: format!("anthropic_{}", type_),
                        param: param.clone(),
                        code: code.clone(),
                    },
                },
            ),
            ApiError::Internal { message } => (
                StatusCode::INTERNAL_SERVER_ERROR,
                ErrorResponse {
                    error: ErrorDetails {
                        message: message.clone(),
                        type_: "internal_error".to_string(),
                        param: None,
                        code: None,
                    },
                },
            ),
            ApiError::Other { message } => (
                StatusCode::INTERNAL_SERVER_ERROR,
                ErrorResponse {
                    error: ErrorDetails {
                        message: format!("Internal server error: {}", message),
                        type_: "internal_error".to_string(),
                        param: None,
                        code: None,
                    },
                },
            ),
        };

        (status, Json(error_response)).into_response()
    }
}

/// Converts generic errors into API errors.
///
/// This implementation allows using the `?` operator with functions that
/// return `anyhow::Error`, converting them into our custom `ApiError` type.
impl From<anyhow::Error> for ApiError {
    fn from(err: anyhow::Error) -> Self {
        ApiError::Other { 
            message: err.to_string() 
        }
    }
}

/// Type alias for Results using our custom ApiError type.
///
/// This provides a convenient way to use Result with our ApiError
/// throughout the application.
pub type Result<T> = std::result::Result<T, ApiError>;

/// Type alias for Server-Sent Events (SSE) results.
///
/// Used for streaming responses where errors are converted to Infallible
/// since they are handled within the stream.
pub type SseResult = std::result::Result<Event, Infallible>;

/// Type alias for SSE streams.
///
/// Represents a stream of SSE results that can be sent to clients.
pub type SseStream = ReceiverStream<SseResult>;

/// Type alias for SSE responses.
///
/// Represents the complete SSE response type used by the API endpoints.
pub type SseResponse = axum::response::sse::Sse<SseStream>;
