# Technical Documentation

## Browser Compatibility

Client-side media processing requires the following browser capabilities:

| Feature | Required | Purpose |
|---------|----------|---------|
| WebAssembly | Yes | Runs the wasm-vips image processing library |
| SharedArrayBuffer | Yes | Enables multi-threaded WASM execution |
| Cross-origin isolation | Yes | Required for SharedArrayBuffer in modern browsers |

### Browser Support Matrix

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 92+ | Full support |
| Firefox | 79+ | Full support except embed previews |
| Safari | 15.2+ | Requires `require-corp` instead of `credentialless` |
| Edge | 92+ | Full support |

### Automatic Fallback

When client-side media processing is unavailable, the system automatically falls back to server-side processing. This fallback is transparent to users and requires no action. A message is logged to the browser console indicating the reason for the fallback.

The fallback occurs when any of the following conditions are detected:
- WebAssembly is not supported in the browser
- SharedArrayBuffer is not available
- Cross-origin isolation is not enabled (missing required headers)

## Cross-origin isolation / `SharedArrayBuffer`

WASM-based image optimization requires `SharedArrayBuffer` support, which in turn requires [cross-origin isolation](https://web.dev/articles/cross-origin-isolation-guide).

Once the page is served with these headers, `SharedArrayBuffer` will be available in the browser, and WASM-based image optimization will work as expected. However, all embedded resources (e.g., images, iframes, scripts) must also be served with appropriate CORS headers (or iframe with `iframe-credentialless` for supporting browsers) to ensure cross-origin isolation is maintained. For third party embeds (for example a YouTube video), the plugin uses [iframe `credentialless` attribute](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/IFrame_credentialless) to help with this. For browsers that do not support this attribute, embeds will show an information pane instead of a live preview.

### Troubleshooting

If client-side media processing is not working, check the browser console for messages. Common issues include:

1. **"SharedArrayBuffer is not available"**: The server is not sending the required cross-origin isolation headers.
2. **"Cross-origin isolation is not enabled"**: The headers are present but cross-origin isolation is not active. This can happen if:
   - Third-party resources are blocking isolation
   - Headers are being stripped by a proxy or CDN
   - The page is being served over HTTP instead of HTTPS

3. **"WebAssembly is not supported"**: The browser does not support WebAssembly. This is rare in modern browsers but can occur in older versions or restricted environments.

Check out [this tracking issue](https://github.com/WordPress/gutenberg/issues/74464) for more details and further resources.

