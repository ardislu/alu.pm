# alu&#46;pm/api

This is the API for the [alu.pm](https://alu.pm) short link service.

## Quickstart

1. Install the `wrangler` CLI:
```
npm i -g @cloudflare/wrangler
```

2. Authorize yourself:
```
wrangler login
```

3. Make a copy of `wrangler.toml.example` and rename it to `wrangler.toml`. Set `account_id` in `wrangler.toml`:
```
account_id = [Account ID value from login]
```

4. Create a new KV namespace to store the short link mappings:
```
wrangler kv:namespace create "URL_MAPPING"
```

NOTE: `index.js` has hardcoded references to a KV namespace named `URL_MAPPING`. If you choose a different KV namespace name in the command above, make sure to update `index.js` accordingly.

5. (Optional) Create a preview KV namespace for development:
```
wrangler kv:namespace create "URL_MAPPING" --preview
```

6. Replace the `kv_namespaces` value in `wrangler.toml` as directed by the CLI output.

7. Test that the Worker is working as expected:
```
wrangler dev
```
