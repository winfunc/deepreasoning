//! Request models for the API endpoints.
//!
//! This module defines the structures used to represent incoming API requests,
//! including chat messages, configuration options, and request parameters.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Primary request structure for chat API endpoints.
///
/// This structure represents a complete chat request, including messages,
/// system prompts, and configuration options for both DeepSeek and Anthropic APIs.
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ApiRequest {
    #[serde(default)]
    pub stream: bool,
    
    #[serde(default)]
    pub verbose: bool,
    
    pub system: Option<String>,
    pub messages: Vec<Message>,
    
    #[serde(default)]
    pub deepseek_config: ApiConfig,
    
    #[serde(default)]
    pub anthropic_config: ApiConfig,
}

/// A single message in a chat conversation.
///
/// Represents one message in the conversation history, including
/// its role (system, user, or assistant) and content.
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Message {
    pub role: Role,
    pub content: String,
}

/// Possible roles for a message in a chat conversation.
///
/// Each message must be associated with one of these roles to
/// properly structure the conversation flow.
#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    System,
    User,
    Assistant,
}

/// Configuration options for external API requests.
///
/// Contains headers and body parameters that will be passed
/// to the external AI model APIs.
#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct ApiConfig {
    #[serde(default)]
    pub headers: HashMap<String, String>,
    
    #[serde(default)]
    pub body: serde_json::Value,
}

impl ApiRequest {
    /// Validates that system prompts are not duplicated.
    ///
    /// Checks that a system prompt is not provided in both the root level
    /// and messages array. The system prompt itself is optional.
    ///
    /// # Returns
    ///
    /// * `bool` - True if system prompt validation passes (no duplicates), false otherwise
    pub fn validate_system_prompt(&self) -> bool {
        let system_in_messages = self.messages.iter().any(|msg| matches!(msg.role, Role::System));
        
        // Only invalid if system prompt is provided in both places
        !(self.system.is_some() && system_in_messages)
    }

    /// Returns messages with the system prompt in the correct position.
    ///
    /// Ensures the system prompt (if present) is the first message,
    /// followed by the conversation messages in order.
    ///
    /// # Returns
    ///
    /// * `Vec<Message>` - Messages with system prompt correctly positioned
    pub fn get_messages_with_system(&self) -> Vec<Message> {
        let mut messages = Vec::new();

        // Add system message first
        if let Some(system) = &self.system {
            messages.push(Message {
                role: Role::System,
                content: system.clone(),
            });
        }

        // Add remaining messages
        messages.extend(self.messages.iter().filter(|msg| !matches!(msg.role, Role::System)).cloned());

        messages
    }

    /// Retrieves the system prompt if one is present.
    ///
    /// Checks both the root level system field and the messages array
    /// for a system prompt.
    ///
    /// # Returns
    ///
    /// * `Option<&str>` - The system prompt if found, None otherwise
    pub fn get_system_prompt(&self) -> Option<&str> {
        self.system.as_deref().or_else(|| {
            self.messages
                .iter()
                .find(|msg| matches!(msg.role, Role::System))
                .map(|msg| msg.content.as_str())
        })
    }
}
