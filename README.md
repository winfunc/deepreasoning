<div align="center">

<h1>DeepClaude 🐬🧠</h1>

<img src="frontend/public/deepclaude.png" width="300">

通过统一的API和聊天界面，利用DeepSeek R1的推理能力以及Claude的创造力和代码生成能力。

[![GitHub license](https://img.shields.io/github/license/getasterisk/deepclaude)](https://github.com/getasterisk/deepclaude/blob/main/LICENSE.md)
[![Rust](https://img.shields.io/badge/rust-v1.75%2B-orange)](https://www.rust-lang.org/)
[![API Status](https://img.shields.io/badge/API-Stable-green)](https://deepclaude.asterisk.so)

[Getting Started](#getting-started) •
[Features](#features) •
[API Usage](#api-usage) •
[Documentation](#documentation) •
[Self-Hosting](#self-hosting) •
[Contributing](#contributing)

</div>



## 介绍

DeepClaude是一款高性能的LLM推理API，它将DeepSeek R1的思想链（CoT）推理能力与Anthropic Claude的创造力和代码生成能力相结合。它提供了一个统一的接口，用于利用两种模型的优势，同时保持对API密钥和数据的完全控制。

## 为什么 R1 + Claude?

DeepSeek R1的CoT轨迹展示了LLM经历“元认知”的深度推理——自我纠正、思考边缘情况，以及用自然语言进行准蒙特卡洛树搜索。

然而，R1缺乏代码生成、创造力和会话技能。克劳德3.5十四行诗在这些方面表现出色，使其成为完美的补充。DeepClaude结合了这两种模型，提供：

-R1出色的推理和解决问题的能力
-Claude卓越的代码生成能力和创造力
-单个API调用中的快速流式响应
-使用您自己的API密钥完成控制

## Getting Started

### Prerequisites

- Rust 1.75 or higher
- DeepSeek API key
- Anthropic API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/getasterisk/deepclaude.git
cd deepclaude
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

See [API Docs](https://deepclaude.chat)

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

DeepClaude can be self-hosted on your own infrastructure. Follow these steps:

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

DeepClaude is a free and open-source project by [Asterisk](https://asterisk.so/). Special thanks to:

- DeepSeek for their incredible R1 model
- Anthropic for Claude's capabilities
- The open-source community for their continuous support

---

<div align="center">
Made with ❤️ by <a href="https://asterisk.so">Asterisk</a>
</div>
