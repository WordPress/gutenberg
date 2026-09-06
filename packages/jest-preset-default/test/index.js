import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
const require = createRequire( import.meta.url );
const preset = require( '@wordpress/jest-preset-default' );

describe( '@wordpress/jest-preset-default', () => {
	it( 'exposes the Jest preset when required by package name', () => {
		expect( preset ).toMatchObject( {
			testEnvironment: 'jsdom',
		} );
	} );
} );
