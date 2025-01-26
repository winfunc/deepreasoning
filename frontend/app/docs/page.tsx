"use client"

import Image from "next/image"
import { Card } from "../../components/ui/card"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

// Custom theme based on oneDark but without text background
const customTheme = {
  ...oneDark,
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    backgroundColor: 'transparent',
  },
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    backgroundColor: 'transparent',
  },
  'token': {
    ...oneDark['token'],
    backgroundColor: 'transparent',
  }
}
import { CopyButton } from "../../components/ui/copy-button"

// Example cURL commands and responses
const examples = {
  nonStreaming: {
    curl: `curl -L -X POST 'https://api.deepclaude.com'
-H 'Content-Type: application/json'
-H 'Accept: application/json'
-H 'X-DeepSeek-API-Token: <YOUR_DEEPSEEK_API_TOKEN>'
-H 'X-Anthropic-API-Token: <YOUR_ANTHROPIC_API_TOKEN>'
-d '{
  "stream": false,
  "verbose": false,
  "messages": [
    {
      "content": "How many \"r\"s in the word \"strawberry\"?",
      "role": "user"
    }
  ],
  "deepseek_config": {
    "headers": {
      "Add-Custom-Header-To-DeepSeek-Call": "example"
    },
    "body": {
      "temperature": 0
    }
  },
  "anthropic_config": {
    "headers": {
      "Add-Custom-Header-To-Claude-Call": "example"
    },
    "body": {
      "temperature": 0
    }
  }
}'`,
    response: `{
  "created": "2025-01-26T01:46:54.654574Z",
  "content": [
    {
      "type": "text",
      "text": "<thinking>\\nOkay, let's see. The user is asking how many times the letter \"r\" appears in the word \"strawberry\". Hmm, I need to make sure I spell the word correctly first. Strawberry. S-T-R-A-W-B-E-R-R-Y. Let me break it down letter by letter.\\n\\nStarting with the first letter: S. No r there. Then T. Still no. Third letter is R. That's one. Next is A. Then W. B, E. Now after E comes R, that's the second R. Then another R right after, so that's the third R. Finally Y. Wait, let me check again. Let me write the letters out with their positions:\\n\\n1. S\\n2. T\\n3. R\\n4. A\\n5. W\\n6. B\\n7. E\\n8. R\\n9. R\\n10. Y\\n\\nWait, does strawberry have two R's after the E? Let me think. The correct spelling is S-T-R-A-W-B-E-R-R-Y. So after the E, there are two R's before the Y. So that's positions 8 and 9. So in total, the R's are at position 3, 8, and 9. That makes three R's. But wait, maybe I'm miscounting. Let me write the word again: strawberry. S-T-R-A-W-B-E-R-R-Y. So letters are S, T, R, A, W, B, E, R, R, Y. So indeed, three R's. But sometimes people might miss one. Let me confirm by another method. Maybe splitting the word into parts: \"straw\" and \"berry\". Straw has an R? Let's see: S-T-R-A-W. Yes, there's an R there. Then berry is B-E-R-R-Y. So berry has two R's. So straw (1 R) + berry (2 Rs) equals 3 R's total. Yep, that adds up. So the answer should be three.\\n</thinking>"
    },
    {
      "type": "text",
      "text": "\\n\\nThere are 3 \"r\"s in the word \"strawberry\"."
    }
  ],
  "combined_usage": {
    "total_cost": "$0.003",
    "deepseek_usage": {
      "input_tokens": 18,
      "output_tokens": 491,
      "reasoning_tokens": 430,
      "cached_input_tokens": 0,
      "total_tokens": 509,
      "total_cost": "$0.001"
    },
    "anthropic_usage": {
      "input_tokens": 507,
      "output_tokens": 20,
      "cached_write_tokens": 0,
      "cached_read_tokens": 0,
      "total_tokens": 527,
      "total_cost": "$0.002"
    }
  }
}`
  },
  streaming: {
    curl: `curl -L -X POST 'https://api.deepclaude.com'
-H 'Content-Type: application/json'
-H 'Accept: application/json'
-H 'X-DeepSeek-API-Token: <YOUR_DEEPSEEK_API_TOKEN>'
-H 'X-Anthropic-API-Token: <YOUR_ANTHROPIC_API_TOKEN>'
-d '{
  "stream": true,
  "verbose": false,
  "messages": [
    {
      "content": "How many \"r\"s in the word \"strawberry\"?",
      "role": "user"
    }
  ],
  "deepseek_config": {
    "headers": {
      "Add-Custom-Header-To-DeepSeek-Call": "example"
    },
    "body": {
      "temperature": 0
    }
  },
  "anthropic_config": {
    "headers": {
      "Add-Custom-Header-To-Claude-Call": "example"
    },
    "body": {
      "temperature": 0
    }
  }
}'`,
    response: `event: start
data: {"type":"start","created":"2025-01-26T01:54:59.529246Z"}

event: content
data: {"type":"content","content":[{"type":"text","text":"<thinking>\n"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":"Okay"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":","}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" let"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":"'s"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" see"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":"."}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" The"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" user"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" is"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" asking"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" how"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" many"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" times"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" the"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" letter"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" \""}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":"r"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":"\""}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" appears"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" in"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" the"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" word"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" \""}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":"st"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":"raw"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":"berry"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":"\"."}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" Al"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":"right"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":","}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" first"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":","}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" I"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" need"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" to"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" make"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" sure"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" I"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" spell"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" the"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" word"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" correctly"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":"."}]}

[... SSE events omitted for brevity ...]

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" Therefore"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":","}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" the"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" correct"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" answer"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" is"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":" "}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":"3"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":"."}]}

event: content
data: {"type":"content","content":[{"type":"text","text":"\n</thinking>"}]}

event: content
data: {"type":"content","content":[]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":"\nThe word \"strawberry\" contains 3 \"r"}]}

event: content
data: {"type":"content","content":[{"type":"text_delta","text":"\"s."}]}

event: done
data: {"type":"done"}`
  },
  verbose: {
    curl: `curl -L -X POST 'https://api.deepclaude.com'
-H 'Content-Type: application/json'
-H 'Accept: application/json'
-H 'X-DeepSeek-API-Token: <YOUR_DEEPSEEK_API_TOKEN>'
-H 'X-Anthropic-API-Token: <YOUR_ANTHROPIC_API_TOKEN>'
-d '{
  "stream": false,
  "verbose": true,
  "messages": [
    {
      "content": "How many \"r\"s in the word \"strawberry\"?",
      "role": "user"
    }
  ],
  "deepseek_config": {
    "headers": {
      "Add-Custom-Header-To-DeepSeek-Call": "example"
    },
    "body": {
      "temperature": 0
    }
  },
  "anthropic_config": {
    "headers": {
      "Add-Custom-Header-To-Claude-Call": "example"
    },
    "body": {
      "temperature": 0
    }
  }
}'`,
    response: `{
  "created": "2025-01-26T01:50:47.209411Z",
  "content": [
    {
      "type": "text",
      "text": "<thinking>\\nOkay, let's see. The user is asking how many times the letter \"r\" appears in the word \"strawberry.\" Alright, first, I need to make sure I spell the word correctly. Strawberry. S-T-R-A-W-B-E-R-R-Y. Wait, let me break it down letter by letter to count the \"r\"s.\\n\\nStarting with the first letter: S. That's an S, no R there. Next is T. Still no R. Then R. Ah, that's the first R. So R is the third letter. Then A, W, B, E. So after R, we have A, W, B, E. None of those are Rs. Then after E comes R again. That's the second R. Then another R right after? Wait, let me check again. The word is strawberry. So after E, is it R-R? Let me write it out: S-T-R-A-W-B-E-R-R-Y. Yes, after the E, there are two Rs in a row. So that's two Rs there. Then Y at the end. So total Rs: the third letter is R, and then the 8th and 9th letters are R and R. Wait, let me count the positions to be sure.\\n\\nLet me list each letter with its position:\\n\\n1. S\\n2. T\\n3. R\\n4. A\\n5. W\\n6. B\\n7. E\\n8. R\\n9. R\\n10. Y\\n\\nSo positions 3, 8, and 9. Wait, that's three Rs. Wait, but when I first thought, I had R at position 3, then two Rs at 8 and 9. So that's three Rs in total. But wait, I might be miscounting. Let me spell it again: S-T-R-A-W-B-E-R-R-Y. So after E, it's R-R-Y. So two Rs there. So total Rs would be the one at position 3 and then two more at positions 8 and 9. That makes three Rs. Wait, but I think the correct spelling is actually \"strawberry\" with two Rs. Let me check that again. Maybe I added an extra R by mistake. Let me think. The correct spelling is S-T-R-A-W-B-E-R-R-Y. So yes, two Rs after the E. So that's R at position 3 and then two Rs at positions 8 and 9. So total of three Rs. But wait, I'm confused because when I say the word out loud, \"strawberry\" is pronounced with a sort of double R sound? Or maybe not. Let me confirm the spelling. Strawberry is spelled S-T-R-A-W-B-E-R-R-Y. So yes, there are two Rs towards the end. So in total, three Rs? Wait, no. Let me count again. S (1), T (2), R (3), A (4), W (5), B (6), E (7), R (8), R (9), Y (10). So positions 3, 8, and 9. That's three Rs. But I think that's incorrect. Wait, maybe I'm miscounting. Let me check another way. Let's write the word out: s t r a w b e r r y. So after the 'e', there are two 'r's and then a 'y'. So that's two Rs at the end. Plus the R in the beginning. So that's three Rs. Hmm. But when I actually think about the word, I might have made a mistake here. Wait, maybe the correct spelling is S-T-R-A-W-B-E-R-Y. No, that's not right. Because \"strawberry\" does have two Rs. Let me verify. Yes, the correct spelling is indeed \"strawberry\" with two Rs: S-T-R-A-W-B-E-R-R-Y. So that's two Rs after the E. So total letters R: one at position 3, and two at positions 8 and 9. So three Rs in total. Wait, but that seems conflicting because when I look up the spelling, \"strawberry\" is spelled with two Rs, not three. Wait, no. Let me check again. S-T-R-A-W-B-E-R-R-Y. So the letters are S, T, R, A, W, B, E, R, R, Y. So that's 10 letters. The Rs are at positions 3, 8, and 9. So three Rs. But that can't be right because the standard spelling is \"strawberry\" with two Rs. Wait, maybe I added an extra R. Let me think again. The word is \"strawberry\". Let's break it down. The first part is \"straw\" (S-T-R-A-W), then \"berry\" (B-E-R-R-Y). So \"berry\" has two Rs. So in \"strawberry\", combining \"straw\" and \"berry\", so the Rs are in \"straw\" and \"berry\". Wait, \"straw\" is S-T-R-A-W, which has one R. Then \"berry\" is B-E-R-R-Y, which has two Rs. So combining them, it's S-T-R-A-W-B-E-R-R-Y. So total Rs: one from \"straw\" and two from \"berry\", totaling three Rs. Therefore, the answer should be three. But I'm a bit confused because I might have miscounted. Let me write the word and count manually: S, T, R, A, W, B, E, R, R, Y. Yes, that's three Rs. So the answer is three. But wait, when I actually write \"strawberry\", I think of it as S-T-R-A-W-B-E-R-R-Y, so yes, three Rs. But maybe the user is tricking me, or perhaps I'm overcomplicating. Let me confirm with another method. If I type \"strawberry\" and count the Rs: s(1), t(2), r(3), a(4), w(5), b(6), e(7), r(8), r(9), y(10). So three Rs at positions 3,8,9. Therefore, the answer is 3.\\n</thinking>"
    },
    {
      "type": "text",
      "text": "\\n\\nThere are 3 \"r\"s in the word \"strawberry\"."
    }
  ],
  "deepseek_response": {
    "status": 200,
    "headers": {
      "connection": "keep-alive",
      "x-ds-trace-id": "<x-ds-trace-id>",
      "cf-cache-status": "DYNAMIC",
      "server": "cloudflare",
      "cf-ray": "<cf-ray>",
      "vary": "origin, access-control-request-method, access-control-request-headers",
      "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
      "x-content-type-options": "nosniff", 
      "date": "Sun, 26 Jan 2025 01:50:17 GMT",
      "set-cookie": "<set-cookie>",
      "access-control-allow-credentials": "true",
      "transfer-encoding": "chunked",
      "content-type": "application/json"
    },
    "body": {
      "choices": [
        {
          "finish_reason": "stop",
          "index": 0,
          "logprobs": null,
          "message": {
            "content": "The word \"strawberry\" contains **3** instances of the letter \"r\". Here's the breakdown:\\n\\n1. **S-T-R** (position 3)  \\n2. **B-E-R** (position 8)  \\n3. **R-R-Y** (position 9)  \\n\\nSo, the total count of \"r\"s is **3**. 🍓",
            "reasoning_content": "Okay, let's see. The user is asking how many times the letter \"r\" appears in the word \"strawberry.\" Alright, first, I need to make sure I spell the word correctly. Strawberry. S-T-R-A-W-B-E-R-R-Y. Wait, let me break it down letter by letter to count the \"r\"s.\\n\\nStarting with the first letter: S. That's an S, no R there. Next is T. Still no R. Then R. Ah, that's the first R. So R is the third letter. Then A, W, B, E. So after R, we have A, W, B, E. None of those are Rs. Then after E comes R again. That's the second R. Then another R right after? Wait, let me check again. The word is strawberry. So after E, is it R-R? Let me write it out: S-T-R-A-W-B-E-R-R-Y. Yes, after the E, there are two Rs in a row. So that's two Rs there. Then Y at the end. So total Rs: the third letter is R, and then the 8th and 9th letters are R and R. Wait, let me count the positions to be sure.\\n\\nLet me list each letter with its position:\\n\\n1. S\\n2. T\\n3. R\\n4. A\\n5. W\\n6. B\\n7. E\\n8. R\\n9. R\\n10. Y\\n\\nSo positions 3, 8, and 9. Wait, that's three Rs. Wait, but when I first thought, I had R at position 3, then two Rs at 8 and 9. So that's three Rs in total. But wait, I might be miscounting. Let me spell it again: S-T-R-A-W-B-E-R-R-Y. So after E, it's R-R-Y. So two Rs there. So total Rs would be the one at position 3 and then two more at positions 8 and 9. That makes three Rs. Wait, but I think the correct spelling is actually \"strawberry\" with two Rs. Let me check that again. Maybe I added an extra R by mistake. Let me think. The correct spelling is S-T-R-A-W-B-E-R-R-Y. So yes, two Rs after the E. So that's R at position 3 and then two Rs at positions 8 and 9. So total of three Rs. But wait, I'm confused because when I say the word out loud, \"strawberry\" is pronounced with a sort of double R sound? Or maybe not. Let me confirm the spelling. Strawberry is spelled S-T-R-A-W-B-E-R-R-Y. So yes, there are two Rs towards the end. So in total, three Rs? Wait, no. Let me count again. S (1), T (2), R (3), A (4), W (5), B (6), E (7), R (8), R (9), Y (10). So positions 3, 8, and 9. That's three Rs. But I think that's incorrect. Wait, maybe I'm miscounting. Let me check another way. Let's write the word out: s t r a w b e r r y. So after the 'e', there are two 'r's and then a 'y'. So that's two Rs at the end. Plus the R in the beginning. So that's three Rs. Hmm. But when I actually think about the word, I might have made a mistake here. Wait, maybe the correct spelling is S-T-R-A-W-B-E-R-Y. No, that's not right. Because \"strawberry\" does have two Rs. Let me verify. Yes, the correct spelling is indeed \"strawberry\" with two Rs: S-T-R-A-W-B-E-R-R-Y. So that's two Rs after the E. So total letters R: one at position 3, and two at positions 8 and 9. So three Rs in total. Wait, but that seems conflicting because when I look up the spelling, \"strawberry\" is spelled with two Rs, not three. Wait, no. Let me check again. S-T-R-A-W-B-E-R-R-Y. So the letters are S, T, R, A, W, B, E, R, R, Y. So that's 10 letters. The Rs are at positions 3, 8, and 9. So three Rs. But that can't be right because the standard spelling is \"strawberry\" with two Rs. Wait, maybe I added an extra R. Let me think again. The word is \"strawberry\". Let's break it down. The first part is \"straw\" (S-T-R-A-W), then \"berry\" (B-E-R-R-Y). So \"berry\" has two Rs. So in \"strawberry\", combining \"straw\" and \"berry\", so the Rs are in \"straw\" and \"berry\". Wait, \"straw\" is S-T-R-A-W, which has one R. Then \"berry\" is B-E-R-R-Y, which has two Rs. So combining them, it's S-T-R-A-W-B-E-R-R-Y. So total Rs: one from \"straw\" and two from \"berry\", totaling three Rs. Therefore, the answer should be three. But I'm a bit confused because I might have miscounted. Let me write the word and count manually: S, T, R, A, W, B, E, R, R, Y. Yes, that's three Rs. So the answer is three. But wait, when I actually write \"strawberry\", I think of it as S-T-R-A-W-B-E-R-R-Y, so yes, three Rs. But maybe the user is tricking me, or perhaps I'm overcomplicating. Let me confirm with another method. If I type \"strawberry\" and count the Rs: s(1), t(2), r(3), a(4), w(5), b(6), e(7), r(8), r(9), y(10). So three Rs at positions 3,8,9. Therefore, the answer is 3.",
            "role": "assistant"
          }
        }
      ],
      "created": 1737856217,
      "id": "<id>",
      "model": "deepseek-reasoner",
      "object": "chat.completion",
      "system_fingerprint": "<system_fingerprint>",
      "usage": {
        "completion_tokens": 1423,
        "completion_tokens_details": { "reasoning_tokens": 1343 },
        "prompt_cache_hit_tokens": 0,
        "prompt_cache_miss_tokens": 18,
        "prompt_tokens": 18,
        "prompt_tokens_details": { "cached_tokens": 0 },
        "total_tokens": 1441
      }
    }
  },
  "anthropic_response": {
    "status": 200,
    "headers": {
      "anthropic-ratelimit-input-tokens-reset": "<anthropic-ratelimit-input-tokens-reset>",
      "anthropic-ratelimit-output-tokens-limit": "<anthropic-ratelimit-output-tokens-limit>",
      "anthropic-ratelimit-tokens-reset": "<anthropic-ratelimit-tokens-reset>",
      "content-type": "<content-type>",
      "via": "<via>",
      "anthropic-ratelimit-input-tokens-remaining": "<anthropic-ratelimit-input-tokens-remaining>",
      "anthropic-ratelimit-output-tokens-remaining": "<anthropic-ratelimit-output-tokens-remaining>",
      "anthropic-ratelimit-input-tokens-limit": "<anthropic-ratelimit-input-tokens-limit>",
      "anthropic-ratelimit-output-tokens-reset": "<anthropic-ratelimit-output-tokens-reset>",
      "connection": "<connection>",
      "anthropic-ratelimit-requests-reset": "<anthropic-ratelimit-requests-reset>",
      "anthropic-ratelimit-requests-limit": "<anthropic-ratelimit-requests-limit>",
      "anthropic-ratelimit-tokens-limit": "<anthropic-ratelimit-tokens-limit>",
      "cf-ray": "<cf-ray>",
      "date": "<date>",
      "server": "<server>",
      "cf-cache-status": "<cf-cache-status>",
      "content-length": "<content-length>",
      "anthropic-ratelimit-requests-remaining": "<anthropic-ratelimit-requests-remaining>",
      "anthropic-ratelimit-tokens-remaining": "<anthropic-ratelimit-tokens-remaining>",
      "request-id": "<request-id>",
      "x-robots-tag": "<x-robots-tag>"
    },
    "body": {
      "content": [
        {
          "text": "\\n\\nThere are 3 \"r\"s in the word \"strawberry\".",
          "type": "text"
        }
      ],
      "id": "<msg_id>",
      "model": "claude-3-5-sonnet-20241022",
      "role": "assistant",
      "stop_reason": "end_turn",
      "stop_sequence": null,
      "type": "message",
      "usage": {
        "cache_creation_input_tokens": 0,
        "cache_read_input_tokens": 0,
        "input_tokens": 1490,
        "output_tokens": 20
      }
    }
  },
  "combined_usage": {
    "total_cost": "$0.008",
    "deepseek_usage": {
      "input_tokens": 18,
      "output_tokens": 1423,
      "reasoning_tokens": 1343,
      "cached_input_tokens": 0,
      "total_tokens": 1441,
      "total_cost": "$0.003"
    },
    "anthropic_usage": {
      "input_tokens": 1490,
      "output_tokens": 20,
      "cached_write_tokens": 0,
      "cached_read_tokens": 0,
      "total_tokens": 1510,
      "total_cost": "$0.005"
    }
  }
}`
  }
}

// Code block component with copy button
function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  return (
    <div className="relative h-[400px]">
      <CopyButton value={code} className="absolute right-2 top-2 z-20" />
      <div className="h-full overflow-auto rounded-lg bg-black">
        <SyntaxHighlighter
          language={language}
          style={customTheme}
          customStyle={{
            margin: 0,
            padding: "1rem",
            minHeight: "100%",
            backgroundColor: "black",
            fontSize: "0.875rem"
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

// Side by side code blocks component
function CodeBlockPair({ curl, response }: { curl: string; response: string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      <Card className="p-4 bg-black border-muted">
        <CodeBlock code={curl} />
      </Card>
      <Card className="p-4 bg-black border-muted">
        <CodeBlock code={response} language="json" />
      </Card>
    </div>
  )
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 flex flex-col items-center justify-center px-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
        
        {/* Content */}
        <div className="relative space-y-8 text-center max-w-4xl mx-auto">
          <div className="animate-float">
            <Image
              src="/deepclaude.png"
              alt="DeepClaude Logo"
              width={120}
              height={120}
              className="mx-auto"
              priority
            />
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
            DeepClaude API Documentation
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-[600px] mx-auto">
            Integrate DeepClaude's powerful AI capabilities into your applications with a simple and flexible unified API.
          </p>
        </div>
      </section>

      {/* Base Information */}
      <section className="py-20 px-4 border-b border-border/40">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Base URL */}
          <div>
            <h2 className="text-3xl font-bold mb-4">Base URL</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold">Managed API</h3>
                </div>
                <p className="text-muted-foreground">
                  Use our managed API endpoint for the quickest setup:
                </p>
                <div className="font-mono text-lg text-primary">
                  https://api.deepclaude.com/
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold">Self-hosted</h3>
                </div>
                <p className="text-muted-foreground">
                  For self-hosted deployments, configure your endpoint in config.toml:
                </p>
                <div className="font-mono text-lg text-primary">
                  http://{'{host}'}:{'{port}'}/
                </div>
                <div className="mt-4 p-4 rounded-lg bg-muted/30">
                  <p className="font-medium mb-2">Default Configuration:</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="font-mono">host:</span> 127.0.0.1
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-mono">port:</span> 3000
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Authentication */}
          <div>
            <h2 className="text-3xl font-bold mb-4">Authentication</h2>
            <div className="max-w-3xl">
              <div className="flex items-start gap-3 mb-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg mb-4">
                    The API requires authentication tokens for both DeepSeek and Anthropic services.
                    Both tokens must be included in the request headers:
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="font-mono mb-2 text-primary">X-DeepSeek-API-Token</p>
                      <p className="text-muted-foreground">Your DeepSeek API authentication token</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="font-mono mb-2 text-primary">X-Anthropic-API-Token</p>
                      <p className="text-muted-foreground">Your Anthropic API authentication token</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Responses */}
          <div>
            <h2 className="text-3xl font-bold mb-4">Error Handling</h2>
            <div className="max-w-4xl space-y-8">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg mb-6">
                    When an error occurs, the API returns an appropriate HTTP status code and a JSON response body with error details:
                  </p>
                  <div className="p-4 rounded-lg bg-muted/30 font-mono text-sm mb-8">
                    <pre className="whitespace-pre">
{`{
  "error": {
    "message": string,    // Human-readable error message
    "type": string,       // Error type identifier
    "param": string?,     // Optional parameter that caused the error
    "code": string?       // Optional error code
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Common Error Types</h3>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { code: 400, type: 'bad_request', desc: 'Invalid request parameters or format' },
                    { code: 400, type: 'missing_header', desc: 'Required API token header is missing' },
                    { code: 400, type: 'invalid_system_prompt', desc: 'System prompt provided in both root and messages' },
                    { code: 502, type: 'deepseek_error', desc: 'Error from DeepSeek API' },
                    { code: 502, type: 'anthropic_error', desc: 'Error from Anthropic API' },
                    { code: 500, type: 'internal_error', desc: 'Internal server error' }
                  ].map((error, i) => (
                    <div key={i} className="p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="px-2 py-1 rounded bg-primary/10 text-primary text-sm font-mono">
                          {error.code}
                        </span>
                        <span className="font-mono text-primary">
                          {error.type}
                        </span>
                      </div>
                      <p className="text-muted-foreground">
                        {error.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API Usage Examples */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Non-streaming Section */}
          <div>
            <h2 className="text-3xl font-bold mb-6">Non-streaming API Usage</h2>
            <p className="text-muted-foreground mb-8">
              Make a single request and receive a complete response. This is ideal for simple queries where you don't need real-time updates.
            </p>
            <CodeBlockPair 
              curl={examples.nonStreaming.curl} 
              response={examples.nonStreaming.response} 
            />
          </div>

          {/* Streaming Section */}
          <div>
            <h2 className="text-3xl font-bold mb-6">Streaming API Usage</h2>
            <div className="space-y-4 mb-8">
              <p className="text-muted-foreground">
                Receive responses in real-time as they're generated. Perfect for chat interfaces and live interactions.
              </p>
              <p className="text-muted-foreground">
                The streaming functionality is powered by Server-sent Events (SSE), enabling efficient real-time data transmission from server to client.{" "}
                <a 
                  href="https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Learn more about SSE →
                </a>
              </p>
            </div>
            <CodeBlockPair 
              curl={examples.streaming.curl} 
              response={examples.streaming.response} 
            />
          </div>

          {/* Verbose Mode Section */}
          <div>
            <h2 className="text-3xl font-bold mb-6">API Verbose Mode</h2>
            <p className="text-muted-foreground mb-8">
              Get detailed information about the API calls, including raw responses from both DeepSeek and Claude APIs.
            </p>
            <CodeBlockPair 
              curl={examples.verbose.curl} 
              response={examples.verbose.response} 
            />
          </div>
        </div>
      </section>
    </div>
  )
}
