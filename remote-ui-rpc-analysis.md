# Analysis: `@remote-ui/rpc` as Alternative to `@wordpress/worker-threads`

## Summary

**`@remote-ui/rpc` is not a suitable replacement for `@wordpress/worker-threads`** in the WASM image processing use case due to a fundamental limitation: it does not support ArrayBuffer or typed array transfer.

---

## Critical Finding: ArrayBuffer Support

From the `@remote-ui/rpc` documentation, the following types are **explicitly unsupported**:

- Map, Set, WeakMap, WeakSet
- **ArrayBuffer, typed arrays**
- URL, RegExp
- Class instances

This is a **blocking issue** for the WASM image processing use case, which relies heavily on transferring large image buffers (often 50MB+) between the main thread and worker with zero-copy semantics.

---

## Feature Comparison

| Feature | `@remote-ui/rpc` | `@wordpress/worker-threads` |
|---------|------------------|----------------------------|
| **Primary use case** | UI extensibility with function callbacks | Binary data processing |
| **Function passing across boundary** | ✅ Full support with retain/release | ❌ Not supported |
| **ArrayBuffer transfer** | ❌ Not supported | ✅ Zero-copy transfer |
| **TypedArray support** | ❌ Not supported | ✅ Auto-detected |
| **ImageBitmap transfer** | ❌ Not supported | ✅ Auto-detected |
| **Stream transfer** | ❌ Not supported | ✅ Auto-detected |
| **Memory management** | Automatic for functions | Automatic for transferables |
| **License** | MIT | GPL (WordPress) |
| **Code size** | ~2000+ lines | ~717 lines |

---

## Different Design Goals

### `@remote-ui/rpc`

Designed for Shopify's UI extensibility model where:
- Extension code runs in a sandboxed worker
- UI components need event handlers/callbacks passed across the boundary
- Functions are proxied with automatic retain/release memory management
- Focus is on developer ergonomics for UI interactions

### `@wordpress/worker-threads`

Designed for efficient binary data processing where:
- Large binary buffers (images, WASM memory) transfer between threads
- Zero-copy ArrayBuffer transfer is essential for performance
- Focus is on efficient data transfer, not function proxying

---

## Current Implementation Details

### How `@wordpress/vips` Uses Worker Threads

```
Main Thread: vipsResizeImage(id, 50MB buffer, ...)
  → wrap() creates CALL message with buffer
  → findTransferables() detects ArrayBuffer
  → postMessage with [buffer] in transfer list (zero-copy)
  → Worker receives buffer ownership
  → Worker processes with WASM (wasm-vips)
  → Worker returns new processed buffer
  → Main thread receives result with zero-copy
```

### Transferables Auto-Detected by `@wordpress/worker-threads`

From `packages/worker-threads/src/transferables.ts`:
- ArrayBuffer
- MessagePort
- ImageBitmap
- OffscreenCanvas
- ReadableStream
- WritableStream
- TransformStream
- TypedArrays (Uint8Array, etc.)

---

## What Would Be Required to Use `@remote-ui/rpc`

To use `@remote-ui/rpc` for this use case, you would need one of:

1. **Add binary data support to `@remote-ui/rpc`** - Major upstream change, unlikely to be accepted as it doesn't align with the library's design goals

2. **Wrap `@remote-ui/rpc` with transferable handling** - Would require writing the same transferable detection code that already exists in `@wordpress/worker-threads`, negating any simplicity benefit

3. **Serialize binary data differently** - e.g., Base64 encoding, which would:
   - Increase payload size by ~33%
   - Require encoding/decoding overhead
   - Eliminate zero-copy benefits
   - Destroy performance for large images

---

## Code Size Comparison

### `@wordpress/worker-threads` (717 lines total)

```
 57 lines - index.ts (exports)
206 lines - main-thread.ts (wrap, terminate)
152 lines - rpc.ts (message protocol)
140 lines - transferables.ts (auto-detection)
 79 lines - types.ts (TypeScript types)
 83 lines - worker-thread.ts (expose)
```

This is already minimal and purpose-built for the use case.

---

## Recommendation

**Keep `@wordpress/worker-threads`** for the following reasons:

1. **Fundamental incompatibility**: `@remote-ui/rpc` cannot transfer ArrayBuffer/TypedArray, which is the core requirement for WASM image processing

2. **Already minimal**: The current implementation is only 717 lines and well-designed for its purpose

3. **Different problems**: The libraries solve different problems - function proxying vs. binary data transfer

4. **No benefit**: Switching would require adding the same transferable handling code, providing no simplification

---

## Alternative Approaches to Explore

If the goal is to reduce custom code or use established libraries, consider:

1. **Comlink** (Google) - Supports transferables, similar API to worker-threads, MIT license
   - https://github.com/GoogleChromeLabs/comlink

2. **workerize** - Simpler but may not have full transferable support

3. **threads.js** - Full-featured worker library with transferable support

However, the current `@wordpress/worker-threads` implementation is already simple, well-tested, and fit for purpose.

---

## Sources

- [@remote-ui/rpc npm package](https://www.npmjs.com/package/@remote-ui/rpc)
- [Shopify remote-dom/rpc GitHub](https://github.com/Shopify/remote-dom/tree/remote-ui/packages/rpc)
- [Remote rendering: Shopify's take on extensible UI](https://shopify.engineering/remote-rendering-ui-extensibility)
- [@shopify/web-worker npm package](https://www.npmjs.com/package/@shopify/web-worker)
