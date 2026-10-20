<div align="center">

<h1>DeepReasoning 🐬🧠</h1>

<img src="frontend/public/deepreasoning.png" width="300">

Harness the power of DeepSeek R1's reasoning and Claude's creativity and code generation capabilities with a unified API and chat interface.

[![GitHub license](https://img.shields.io/github/license/getasterisk/deepreasoning)](https://github.com/getasterisk/deepreasoning/blob/main/LICENSE.md)
[![Rust](https://img.shields.io/badge/rust-v1.75%2B-orange)](https://www.rust-lang.org/)
[![API Status](https://img.shields.io/badge/API-Stable-green)](https://deepreasoning.asterisk.so)

[Getting Started](#getting-started) •
[Features](#features) •
[API Usage](#api-usage) •
[Documentation](#documentation) •
[Self-Hosting](#self-hosting) •
[Contributing](#contributing)

---

> [!NOTE]
> **Disclaimer:** This project is not affiliated with, endorsed by, or sponsored by Anthropic. Claude is a trademark of Anthropic, PBC. This is an independent developer project using Claude.

</div>

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Why R1 + Claude?](#why-r1--claude)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [API Usage](#api-usage)
  - [Basic Example](#basic-example)
  - [Streaming Example](#streaming-example)
- [Configuration Options](#configuration-options)
- [Self-Hosting](#self-hosting)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Overview

DeepReasoning is a high-performance LLM inference API that combines DeepSeek R1's Chain of Thought (CoT) reasoning capabilities with Anthropic Claude's creative and code generation prowess. It provides a unified interface for leveraging the strengths of both models while maintaining complete control over your API keys and data.

## Features

🚀 **Zero Latency** - Instant responses with R1's CoT followed by Claude's response in a single stream, powered by a high-performance Rust API

🔒 **Private & Secure** - End-to-end security with local API key management. Your data stays private

⚙️ **Highly Configurable** - Customize every aspect of the API and interface to match your needs

🌟 **Open Source** - Free and open-source codebase. Contribute, modify, and deploy as you wish

🤖 **Dual AI Power** - Combine DeepSeek R1's reasoning with Claude's creativity and code generation

🔑 **Managed BYOK API** - Use your own API keys with our managed infrastructure for complete control

## Why R1 + Claude?

DeepSeek R1's CoT trace demonstrates deep reasoning to the point of an LLM experiencing "metacognition" - correcting itself, thinking about edge cases, and performing quasi Monte Carlo Tree Search in natural language.

However, R1 lacks in code generation, creativity, and conversational skills. Claude 3.5 Sonnet excels in these areas, making it the perfect complement. DeepReasoning combines both models to provide:

- R1's exceptional reasoning and problem-solving capabilities
- Claude's superior code generation and creativity
- Fast streaming responses in a single API call
- Complete control with your own API keys

## Getting Started

### Prerequisites

- Rust 1.75 or higher
- DeepSeek API key
- Anthropic API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/getasterisk/deepreasoning.git
cd deepreasoning
```

2. Build the project:
```bash
cargo build --release
```

### Configuration

Create a `config.toml` file in the project root:

```toml
[server]
host = "127.0.0.1"
port = 3000

[pricing]
# Configure pricing settings for usage tracking
```

## API Usage

See [API Docs](https://deepreasoning.chat)

### Web grounding

Add `web_context` to a chat request to ground both DeepSeek's reasoning and
Claude's response in current web evidence. [Parallel Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp)
is the built-in provider: search uses Fast mode and needs no account or API key.
This is explicit request-time retrieval, rather than model-selected tool use.
The chat interface continues to send ordinary chat requests.

```json
{
  "messages": [{"role": "user", "content": "What changed in the latest Rust release?"}],
  "web_context": {
    "type": "search",
    "objective": "Find the latest stable Rust release announcement and summarize its changes",
    "search_queries": ["latest stable Rust release announcement"]
  }
}
```

Use the existing DeepSeek and Anthropic token headers. Both streaming and
non-streaming requests support this field. To extract a specific page instead,
use `"web_context": {"type": "fetch", "urls": ["https://blog.rust-lang.org/"],
"objective": "Find the latest stable release announcement"}`. Search accepts
1–3 queries (up to 500 characters each) and an objective up to 5,000 characters;
fetch accepts 1–3 HTTP(S) URLs without embedded credentials and an optional
objective up to 200 characters.

Only the explicit objective, queries or URLs are sent to Parallel. Chat history,
system prompts and model API keys are not sent to it. Returned source text is
untrusted evidence, capped at 25,000 characters, and included in the last user
message sent to both models with instructions to cite source URLs. Review cited
sources before relying on an answer. Retrieval adds latency before the response
starts, has a 20-second deadline, and returns a `web_context_error` (HTTP 502) on
service or protocol failure; it never silently answers without the requested
evidence. Free anonymous access has service limits.

Omit `web_context` or set it to `null` for ordinary chat with no retrieval.
Operators can prohibit retrieval by setting `allow_web_context = false` under
`[server]` in `config.toml`; existing configuration files default to allowing
explicit requests. Model choices, API credentials and custom model configuration
continue to work as before.

For a conversation or related research requests, generate a random UUID once and
include it as `session_id` inside each `web_context` object. Reuse it for search,
fetch, follow-up turns and retries, including retries after service limits. Start
a new UUID for a new chat or research run; do not derive it from user information.
If omitted, the request is treated as a standalone research run and gets a fresh
UUID. These identifiers are separate from the MCP transport session and are never
stored on the shared HTTP client.

### Basic Example

```python
import requests

response = requests.post(
    "http://127.0.0.1:1337/",
    headers={
        "X-DeepSeek-API-Token": "<YOUR_DEEPSEEK_API_KEY>",
        "X-Anthropic-API-Token": "<YOUR_ANTHROPIC_API_KEY>"
    },
    json={
        "messages": [
            {"role": "user", "content": "How many 'r's in the word 'strawberry'?"}
        ]
    }
)

print(response.json())
```

### Streaming Example

```python
import asyncio
import json
import httpx

async def stream_response():
    async with httpx.AsyncClient() as client:
        async with client.stream(
            "POST",
            "http://127.0.0.1:1337/",
            headers={
                "X-DeepSeek-API-Token": "<YOUR_DEEPSEEK_API_KEY>",
                "X-Anthropic-API-Token": "<YOUR_ANTHROPIC_API_KEY>"
            },
            json={
                "stream": True,
                "messages": [
                    {"role": "user", "content": "How many 'r's in the word 'strawberry'?"}
                ]
            }
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line:
                    if line.startswith('data: '):
                        data = line[6:]
                        try:
                            parsed_data = json.loads(data)
                            if 'content' in parsed_data:
                                content = parsed_data.get('content', '')[0]['text']
                                print(content, end='',flush=True)
                            else:
                                print(data, flush=True)
                        except json.JSONDecodeError:
                            pass

if __name__ == "__main__":
    asyncio.run(stream_response())
```

## Configuration Options

The API supports extensive configuration through the request body:

```json
{
    "stream": false,
    "verbose": false,
    "system": "Optional system prompt",
    "messages": [...],
    "deepseek_config": {
        "headers": {},
        "body": {}
    },
    "anthropic_config": {
        "headers": {},
        "body": {}
    }
}
```

## Self-Hosting

DeepReasoning can be self-hosted on your own infrastructure. Follow these steps:

1. Configure environment variables or `config.toml`
2. Build the Docker image or compile from source
3. Deploy to your preferred hosting platform

## Security

- No data storage or logged
- BYOK (Bring Your Own Keys) architecture
- Regular security audits and updates

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:

- Code of Conduct
- Development process
- Submitting pull requests
- Reporting issues

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

## Acknowledgments

DeepReasoning is a free and open-source project by [Asterisk](https://asterisk.so/). Special thanks to:

- DeepSeek for their incredible R1 model
- Anthropic for Claude's capabilities
- The open-source community for their continuous support

---

<div align="center">
Made with ❤️ by <a href="https://asterisk.so">Asterisk</a>
</div>
