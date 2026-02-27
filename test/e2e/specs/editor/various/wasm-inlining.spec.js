/**
 * Build verification test for WASM inlining in the vips package.
 *
 * This test verifies that the build process correctly inlines WASM files
 * as base64 data URLs in the vips package output.
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

	test( 'should inline vips.wasm as base64 data URL', () => {
		// Verify the main vips.wasm is inlined
		// Variable name: vips_default (from wasm-vips/vips.wasm)
		expect( buildContent ).toMatch(
			/var vips_default\s*=\s*"data:application\/wasm;base64,/
		);
	} );

	test( 'should inline vips-jxl.wasm as base64 data URL', () => {
		// Verify vips-jxl.wasm is inlined
		// Variable name: vips_jxl_default (from wasm-vips/vips-jxl.wasm)
		expect( buildContent ).toMatch(
			/var vips_jxl_default\s*=\s*"data:application\/wasm;base64,/
		);
	} );

	test( 'should have substantial inlined WASM data', () => {
		// The inlined WASM should be large (original files are several MB)
		// This ensures we're actually inlining the full WASM, not just a stub
		// The built file should be at least 10MB due to the inlined WASM
		expect( buildContent.length ).toBeGreaterThan( 10 * 1024 * 1024 );
	} );
} );
