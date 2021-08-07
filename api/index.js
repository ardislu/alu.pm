import { ethers } from 'ethers';

async function handleRequest(request) {
  // Handle new short link creation
  if (request.method === 'POST') {
    // Parse user form inputs
    const body = await request.text();
    const searchParams = new URLSearchParams(body);
    let shortUrl = searchParams.get('short-url'); // Must match HTML <input> ID
    const fullUrl = searchParams.get('full-url'); // Must match HTML <input> ID
    const signature = searchParams.get('signature'); // Must match HTML <input> ID
    let isCustomShortUrl = true;
    const message = `Sign this message to create the short URL "https://alu.pm/${shortUrl}" for the full URL "${fullUrl}".`; // Must match frontend exactly

    // Validation regex to short circuit known bad inputs
    const validShortUrlRegex = /^[0-9a-zA-Z-_]*$/g;

    // Generic error responses
    const invalidShortUrlResponse = new Response('Invalid short URL', { status: 400 });
    const invalidFullUrlResponse = new Response('Invalid full URL', { status: 400 });
    const invalidSignatureResponse = new Response('Invalid signature', { status: 403 });

    // Generate random 4 character shortUrl if none is provided
    if (shortUrl === null || shortUrl === '') {
      isCustomShortUrl = false;
      do {
        let array = new Uint32Array(4);
        crypto.getRandomValues(array);
        // Need to spread typed array into a non-typed array to allow .map() to output strings,
        // and use .toString(36) to convert number to alphanumeric (base-36 = 0-9 + a-z)
        shortUrl = [...array].map(v => (v % 36).toString(36)).join('');
      } while (await URL_MAPPING.get(shortUrl) !== null); // Check that the random shortUrl isn't already taken
    }
    // Short circuit known bad shortUrls
    else if (!validShortUrlRegex.test(shortUrl) || shortUrl === 'favicon.ico') {
      return invalidShortUrlResponse;
    }
    // Catch user-provided duplicate shortUrls
    else if (await URL_MAPPING.get(shortUrl) !== null) {
      return invalidShortUrlResponse;
    }

    // Short circuit known bad fullUrls
    try {
      new URL(fullUrl);
    }
    catch (error) {
      return invalidFullUrlResponse;
    }

    if (isCustomShortUrl) {
      const signingAddress = ethers.utils.verifyMessage(message, signature);
      // Data is hardcoded for speed to meet Cloudflare Worker CPU time limitation
      // Hardcoded function name = balanceOf
      // Hardcoded second uint256 parameter = 5
      const data = `0x00fdd58e000000000000000000000000${signingAddress.substring(2)}0000000000000000000000000000000000000000000000000000000000000005`;

      const rpcBody = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "eth_call",
        "params": [
          {
            "to": "0x74EE68a33f6c9f113e22B3B77418B75f85d07D22", // Hardcoded Zerion ERC-1155 NFT address
            "data": data
          },
          "latest"
        ]
      }

      // ethers.js is too slow, need to directly call the JSON RPC API
      const resp = await fetch('https://cloudflare-eth.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rpcBody)
      });
      const tokens = parseInt((await resp.json())['result']);

      if (!(tokens > 0)) {
        return invalidSignatureResponse;
      }
    }

    await URL_MAPPING.put(shortUrl, fullUrl);
    return new Response(`Successfully created short URL: https://alu.pm/${shortUrl}`);
  }

  // Handle short link fetch
  if (request.method === 'GET') {
    const shortUrl = request.url.split('/').pop();
    const validShortUrlRegex = /^[0-9a-zA-Z-_]*$/g;
    const invalidResponse = new Response('Invalid short URL', { status: 404 });

    // Short circuit known bad shortUrls
    if (!validShortUrlRegex.test(shortUrl) || shortUrl === null || shortUrl === undefined || shortUrl === '' || shortUrl === 'favicon.ico') {
      return invalidResponse;
    }

    const redirectUrl = await URL_MAPPING.get(shortUrl);

    // redirectUrl will be null if there is no existing mapping
    if (redirectUrl === null) {
      return invalidResponse;
    }

    // Prevent infinite loops
    if (redirectUrl === request.url) {
      return invalidResponse;
    }

    return new Response(redirectUrl, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET'
      }
    });
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
})
