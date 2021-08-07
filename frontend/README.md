# alu&#46;pm/frontend

This is the frontend for [alu.pm](https://alu.pm), which is a short link service with access control powered by NFTs on the Ethereum blockchain!

## 404.html as a router

Cloudflare Pages automatically redirects any `HTTP 404 Not Found` to `404.html` if it exists. I'm using `404.html` as a router for short links. Here's how to replicate Cloudflare Pages' treatment of `404.html` on a local development server:

1. Install Node.js (this is ONLY used for the web server; the website itself does not use Node.js)

2. `npm i -g http-server`

3. By default, `http-server` already redirects 404 errors to `404.html` (no extra configuration needed):
```
http-server
```

## Javascript modules

`ethers.js` is imported as an ES6 module in `index.html`. For modules to work correctly, the `Content-Type` response header must be set to the [correct MIME type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules#aside_%E2%80%94_.mjs_versus_.js) by the web server serving the module file. `http-server` does this automatically.
