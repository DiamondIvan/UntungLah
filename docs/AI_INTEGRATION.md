# Qwen integration

The Express API exposes `POST /api/ai/coach`. The web interface submits one of three tasks in the shared contract.

| Task | Context |
| --- | --- |
| `explain` | Baseline and adjusted inputs, simulation type and optional business summary |
| `question` | A short user question and optional business summary |
| `learning` | The product and aggregate financial figures with completed topics, when available |

The API recalculates comparison metrics from validated inputs. It sends the relevant structured context to Qwen with instructions to ground the reply in supplied facts, state assumptions and suggest one or two achievable actions. The business summary includes a product and business type, aggregate figures and completed learning topics. Transaction histories stay in the browser.

## Configure the provider

Populate `DASHSCOPE_API_KEY`, `QWEN_BASE_URL` and `QWEN_MODEL` in a private `.env` file and restart Express. Use the OpenAI-compatible HTTPS base URL ending in `/compatible-mode/v1` and an enabled Qwen chat model for the region associated with the key. The API uses the OpenAI SDK with a ten-second provider timeout. [Model Studio Chat API](https://www.alibabacloud.com/help/en/model-studio/qwen-api-via-openai-chat-completions)

The API returns an envelope containing `source` and `answer`. Zod validates the headline, explanation, insights, recommendations, next learning topic, assumptions and limitations. Unconfigured, unavailable or malformed provider responses yield a deterministic answer with `source: "demo"`. A valid provider answer uses `source: "qwen"`.

## Check the endpoint

Start Express on its default port. This PowerShell request exercises the same price decision as the guided demo.

```powershell
$body = @{ task = 'explain'; simulation = @{ kind = 'pricing'; baseline = @{ price = 5; cost = 3; units = 40 }; adjusted = @{ price = 5.5; cost = 3; units = 40 } } } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri http://127.0.0.1:3001/api/ai/coach -Method Post -ContentType 'application/json' -Body $body
```

Use the source field to distinguish the live check from the offline fallback. Keep provider codes, key values and configuration screenshots containing credentials out of submission evidence.
