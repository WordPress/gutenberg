/**
 * Build verification test for WASM inlining in the vips package.
 *
 * This test verifies that the build process correctly inlines WASM files
 * into the vips package output as a compact UTF-8 binary string that is
 * decoded back to a `Uint8Array` at runtime (rather than a base64 data URL).
 */

/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const buildModulePath = path.resolve(
	__dirname,
	'../../../../../packages/vips/build-module/index.mjs'
);

test.describe( 'WASM Inlining (build verification)', () => {
	let buildContent;

	test.beforeAll( () => {
		// This test requires the build to have run.
		// In E2E tests, `npm run build` runs before tests.
		buildContent = fs.readFileSync( buildModulePath, 'utf8' );
	} );

	test( 'should inline vips.wasm as a decoded Uint8Array, not a base64 data URL', () => {
		// `vips_default` is the inlined `wasm-vips/vips.wasm` export. It is now a
		// `Uint8Array` decoded from a compact UTF-8 string at runtime, so the
		// inlined bytes compress well.
		expect( buildContent ).toMatch( /var vips_default\s*=\s*\w+;/ );

		// It must no longer be the old base64 data URL string.
		expect( buildContent ).not.toMatch( /data:application\/wasm;base64,/ );

		// The runtime decode loop converts the inlined string into bytes.
		expect( buildContent ).toMatch( /new Uint8Array\(\s*\w+\.length\s*\)/ );
		expect( buildContent ).toMatch(
			/\w+\[\s*i\s*\]\s*=\s*\w+\.charCodeAt\(\s*i\s*\);/
		);
	} );

	test( 'should have substantial inlined WASM data', () => {
		// The inlined WASM should be large (original files are several MB)
		// This ensures we're actually inlining the full WASM, not just a stub
		// The built file should be at least 5MB due to the inlined WASM
		expect( buildContent.length ).toBeGreaterThan( 5 * 1024 * 1024 );
	} );
} );
