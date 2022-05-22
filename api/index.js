import { ethers } from 'ethers';

// Make generic HTML for createShortLink, with no favicon.ico request (prevents additional GET request on this worker)
function createHtml(title, response) {
  const htmlBody = `<!DOCTYPE html>
  <html lang="en">

  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="data:,"> 
    <title>{{title}}</title>
  </head>

  <body>
    <main>
      <p>{{response}}</p>
      <a href="https://alu.pm">alu.pm</a>
    </main>
  </body>

  </html>`;

  return htmlBody.replace('{{title}}', title).replace('{{response}}', response);
}

// createShortLink should return an HTML response for end-users, because the frontend no longer has control after POST-ing to the API
async function createShortLink(request) {
  // Parse user form inputs
  const body = await request.text();
  const searchParams = new URLSearchParams(body);
  let shortUrl = searchParams.get('short-url'); // Must match HTML <input> ID
  const fullUrl = searchParams.get('full-url'); // Must match HTML <input> ID
  const signature = searchParams.get('signature'); // Must match HTML <input> ID

  // To control signature verification
  let isCustomShortUrl = true;
  const message = `Sign this message to create the short URL "https://alu.pm/${shortUrl}" for the full URL "${fullUrl}".`; // Must match frontend exactly

  // Validation regex to short circuit known bad inputs
  const validShortUrlRegex = /^[0-9a-zA-Z-_]*$/g;

  // Generic error responses
  const invalidShortUrlResponse = new Response(createHtml('Error', 'Invalid short URL'), { status: 400, headers: {'Content-Type': 'text/html; charset=UTF-8'} });
  const invalidFullUrlResponse = new Response(createHtml('Error', 'Invalid full URL'), { status: 400, headers: {'Content-Type': 'text/html; charset=UTF-8'} });
  const invalidSignatureResponse = new Response(createHtml('Error', 'Invalid signature'), { status: 403, headers: {'Content-Type': 'text/html; charset=UTF-8'} });

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
    const resp = await fetch('https://eth.alu.pm/v1/mainnet', {
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
  return new Response(createHtml('Success!', `Successfully created short URL: https://alu.pm/${shortUrl}`), { headers: {'Content-Type': 'text/html; charset=UTF-8'} });
}

// getLink should return a text/plain response, the 404.html router on the frontend will take the body and use it to redirect on client-side
async function getLink(request) {
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

async function handleRequest(request) {
  const method = request.method;

  if (method === 'POST') {
    return await createShortLink(request);
  }
  else if (method === 'GET') {
    return await getLink(request);
  }
  else {
    return new Response(createHtml('Error', `HTTP operation: ${method} not supported`), { status: 400, headers: {'Content-Type': 'text/html; charset=UTF-8'} });
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
})
