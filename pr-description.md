# Add @wordpress/worker-threads package and migrate @wordpress/vips from @shopify/web-worker

## What?

See #69254

This PR introduces a new `@wordpress/worker-threads` package that provides type-safe Web Worker RPC communication, and migrates `@wordpress/vips` to use it instead of `@shopify/web-worker`.

## Why?

The `@shopify/web-worker` package has several issues for Gutenberg:
1. **Unmaintained** - The repository is archived
2. **Requires webpack and Babel** - Gutenberg has moved to esbuild
3. **Build-time magic** - Uses webpack chunk naming and Babel transforms that don't work with our build system

Alternative libraries were evaluated:
- **Comlink** - Uses Apache 2.0 license, incompatible with GPL-2.0+ for combined work in WordPress core
- **threads.js** - Unmaintained
- **workerize** - Unmaintained, requires webpack

The solution is to create our own lightweight package that:
- Works with esbuild (no webpack/babel required)
- Is GPL-2.0+ licensed
- Provides similar ergonomics to Comlink/Shopify web-worker

## How?

### New `@wordpress/worker-threads` package

Provides three main exports:
- `wrap(worker)` - Creates a proxy for a Worker that exposes its methods as async functions
- `terminate(remote)` - Terminates a wrapped worker and cleans up resources
- `expose(api)` - Exposes an object's methods to be called from the main thread (used in worker script)

Features:
- Automatic transferable detection for efficient ArrayBuffer transfer (zero-copy)
- Full TypeScript support with `Remote<T>` type
- ~1.5KB bundle size
- Promise-based RPC with proper error propagation

### Build system enhancement

Added `wpWorkers` field support to `@wordpress/build`. Packages can now declare worker entry points in package.json:

```json
{
  "wpWorkers": {
    "./worker": "./src/worker.ts"
  }
}
```

Workers are bundled as self-contained files with all dependencies included.

### Migration of `@wordpress/vips`

- Updated `worker.ts` to use `expose()` from the new package
- Updated `vips-worker.ts` to use `wrap()` and `terminate()`
- Made package ESM-only (wasm-vips uses top-level await which is incompatible with CJS)
- Removed `@shopify/web-worker` dependency

## Testing Instructions

1. Run `npm install` to update dependencies
2. Run `npm run build` to build all packages
3. Verify the build succeeds without errors
4. Check that `packages/worker-threads/build-module/` contains the built files
5. Check that `packages/vips/build-module/` contains:
   - `index.mjs` - Main entry point
   - `vips-worker.mjs` - Worker API wrapper
   - `worker.mjs` - Self-contained worker bundle (~17MB with WASM)

### Testing the worker functionality

The vips package functionality can be tested through the media upload flow:
1. Start wp-env: `npm run wp-env start`
2. Upload an image to the media library
3. Image processing (resize, format conversion) should work via the worker

### Testing Instructions for Keyboard

N/A - This is a build/infrastructure change with no UI modifications.

## Screenshots or screencast

N/A - Infrastructure/build system change.
