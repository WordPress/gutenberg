# Technical Documentation

## Cross-origin isolation / `SharedArrayBuffer`

WASM-based image optimization requires `SharedArrayBuffer` support, which in turn requires [cross-origin isolation](https://web.dev/articles/cross-origin-isolation-guide). To implement this, the editor uses the following headers:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: credentialless` (or `require-corp` for safari)

Once the page is served with these headers, `SharedArrayBuffer` will be available in the browser, and WASM-based image optimization will work as expected. However, all embedded resources (e.g., images, iframes, scripts) must also be served with appropriate CORS headers to ensure cross-origin isolation is maintained. For third party embeds (for example a YouTube video), the plugin uses [iframe `credentialless` attribute](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/IFrame_credentialless) to help with this. For browsers that do not support this attribute, embeds will show an information pane instead of a live preview.

Check out [this tracking issue](https://github.com/swissspidy/media-experiments/issues/294) for more details and further resources.

