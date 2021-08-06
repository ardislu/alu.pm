# alu&#46;pm/frontend

This is the frontend for my short link service [alu.pm](https://alu.pm), which has access control powered by NFTs on the Ethereum blockchain!

## 404.html as a router

GitHub Pages automatically redirects any `HTTP 404 Not Found` to `404.html` if it exists. I'm using `404.html` as a router for short links. Here's how to replicate GitHub Pages' treatment of `404.html` on a local development server:

1. Install Node.js (this is ONLY used for the web server; the website itself does not use Node.js)

2. `npm i -g http-server`

3. By default, `http-server` already redirects 404 errors to `404.html` (no extra configuration needed):
```
http-server
```
