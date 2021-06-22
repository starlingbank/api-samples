# 🛃 Starling webhook verification samples

These demonstrate how to verify the `X-Hook-Signature` header on Starling Bank webhooks.

You can test any of the server examples with:

```bash
curl -X POST localhost:8000 -H "Content-Type: application/json" -d '{"key":"value"}' -H "X-Hook-Signature: HJszr9xjvi9+i/wG3PLbxev1aWnCCgNqDYtRgIR+dxs+c+CJvw+8s6vm/dVmQGxpLVM9Cwkr7wDjUfoFYtCNHQ=="
```

For more information on webhooks, and the API in general, see the documentation on the [developer portal](https://developer.starlingbank.com/docs).