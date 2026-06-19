/**
 * Standalone script module that exports the inlined bytes for the
 * `vips-jxl.wasm` dynamic library.
 *
 * Keeping the WASM import in its own module means the ~3 MB of inlined
 * binary only ships in the `@wordpress/vips/jxl-wasm` script module and
 * is fetched over the network the first time a consumer
 * dynamically imports it — not when `@wordpress/vips/worker` is loaded.
 *
 * @see packages/vips/src/vips-worker.ts — the consumer.
 */

// @ts-expect-error - WASM files are inlined as a Uint8Array at build time.
import VipsJxlModule from 'wasm-vips/vips-jxl.wasm';

export default VipsJxlModule as Uint8Array< ArrayBuffer >;
