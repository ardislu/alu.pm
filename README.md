# alu.pm

Short link service with access control on the Ethereum blockchain

## Quickstart

1. Clone this repo
```
git clone https://github.com/ardislu/alu-pm.git
```

2. Install dependencies
```
npm i
```

3. `cd` into each workspace and follow the README instructions for that component. Example:
```
cd api
```

## api

API is hosted on a [Cloudflare Worker](https://workers.cloudflare.com/). The short link mapping is contained on [Cloudflare Workers KV](https://www.cloudflare.com/products/workers-kv/).

## frontend

Minimal frontend to demo short link creation and redirection.

## solidity

The smart contract deployed on the Ethereum blockchain to handle authentication (NFTs)