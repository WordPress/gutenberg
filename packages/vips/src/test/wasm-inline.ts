/**
 * External dependencies
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe( 'WASM Inlining', () => {
	const buildModulePath = resolve(
		__dirname,
		'../../build-module/index.mjs'
	);
	let buildContent: string;

	beforeAll( () => {
		buildContent = readFileSync( buildModulePath, 'utf8' );
	} );

	it( 'should inline vips.wasm as base64 data URL', () => {
		// Verify the main vips.wasm is inlined
		// Variable name: vips_default (from wasm-vips/vips.wasm)
		expect( buildContent ).toMatch(
			/var vips_default\s*=\s*"data:application\/wasm;base64,/
		);
	} );

	it( 'should inline vips-heif.wasm as base64 data URL', () => {
		// Verify vips-heif.wasm is inlined
		// Variable name: vips_heif_default (from wasm-vips/vips-heif.wasm)
		expect( buildContent ).toMatch(
			/var vips_heif_default\s*=\s*"data:application\/wasm;base64,/
		);
	} );

	it( 'should inline vips-jxl.wasm as base64 data URL', () => {
		// Verify vips-jxl.wasm is inlined
		// Variable name: vips_jxl_default (from wasm-vips/vips-jxl.wasm)
		expect( buildContent ).toMatch(
			/var vips_jxl_default\s*=\s*"data:application\/wasm;base64,/
		);
	} );

	it( 'should have substantial inlined WASM data', () => {
		// The inlined WASM should be large (original files are several MB)
		// This ensures we're actually inlining the full WASM, not just a stub
		// The built file should be at least 10MB due to the inlined WASM
		expect( buildContent.length ).toBeGreaterThan( 10 * 1024 * 1024 );
	} );
} );
