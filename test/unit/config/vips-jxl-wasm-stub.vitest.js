/**
 * Stub for the @wordpress/vips/jxl-wasm script module.
 *
 * The real module inlines the ~3 MB vips-jxl.wasm binary at build time, which
 * unit tests neither have nor need. Only the shape matters: a default export
 * holding the raw bytes.
 *
 * Tests that need to customize this can use vi.mock() in their test files.
 */

export default new Uint8Array( [ 1, 2, 3, 4 ] );
