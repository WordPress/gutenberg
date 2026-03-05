# Technical Documentation

## Browser Compatibility

Client-side media processing requires the following browser capabilities:

| Feature | Required | Purpose |
|---------|----------|---------|
| WebAssembly | Yes | Runs the wasm-vips image processing library |
| SharedArrayBuffer | Yes | Enables multi-threaded WASM execution |
| Document-Isolation-Policy | Yes | Required for SharedArrayBuffer in modern browsers |
| CSP `blob:` workers | Yes | The WASM worker is loaded via a blob URL |

### Browser Support Matrix

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chromium | 137+ | Full support via Document-Isolation-Policy |
| Edge | 137+ | Full support via Document-Isolation-Policy |
| Firefox | Not supported | Does not support Document-Isolation-Policy |
| Safari | Not supported | Does not support Document-Isolation-Policy |

### Automatic Fallback

When client-side media processing is unavailable, the system automatically falls back to server-side processing. This fallback is transparent to users and requires no action. A message is logged to the browser console indicating the reason for the fallback.

The fallback occurs when any of the following conditions are detected:
- WebAssembly is not supported in the browser
- SharedArrayBuffer is not available
- Document-Isolation-Policy is not supported by the browser
- The site's Content Security Policy (CSP) blocks blob URL workers

## Cross-origin isolation / `SharedArrayBuffer`

WASM-based image optimization requires `SharedArrayBuffer` support, which in turn requires [cross-origin isolation](https://web.dev/articles/cross-origin-isolation-guide).

This is achieved using the [`Document-Isolation-Policy`](https://github.com/nicolo-ribaudo/tc39-proposal-structs/blob/main/test262-filtering/isolation-explainer.md) header, which provides per-document cross-origin isolation without affecting other iframes on the page. This avoids the breakage that the older `Cross-Origin-Embedder-Policy` / `Cross-Origin-Opener-Policy` headers caused for third-party plugins and embeds.

Once the page is served with this header, `SharedArrayBuffer` will be available in the browser, and WASM-based image optimization will work as expected. All embedded resources (e.g., images, scripts) are served with `crossorigin="anonymous"` to ensure cross-origin isolation is maintained.

### Troubleshooting

If client-side media processing is not working, check the browser console for messages. Common issues include:

1. **"SharedArrayBuffer is not available"**: The server is not sending the required cross-origin isolation headers.
2. **"Cross-origin isolation is not enabled"**: The headers are present but cross-origin isolation is not active. This can happen if:
   - Headers are being stripped by a proxy or CDN
   - The page is being served over HTTP instead of HTTPS

3. **"WebAssembly is not supported"**: The browser does not support WebAssembly. This is rare in modern browsers but can occur in older versions or restricted environments.

4. **"Content Security Policy (CSP) does not allow blob: workers"**: A security plugin or server configuration is setting a `worker-src` CSP directive that does not include `blob:`. The WASM image processing worker is loaded via a blob URL, which requires CSP to permit it. To resolve this:
   - Add `blob:` to the `worker-src` directive in the site's CSP header (e.g., `worker-src 'self' blob:`)
   - If using a security plugin (e.g., WP Cerber, Wordfence, or similar), check its CSP settings and add `blob:` to the allowed worker sources
   - If the CSP header is set at the server level (e.g., in `.htaccess`, Nginx config, or a CDN), update it there

Check out [this tracking issue](https://github.com/WordPress/gutenberg/issues/74464) for more details and further resources.
