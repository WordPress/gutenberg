import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const require = createRequire( import.meta.url );

const configDirectory = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'..'
);

describe( 'shipped configs', () => {
	it( 'inlines the npm-package-json-lint preset instead of extending it', () => {
		const config = require(
			path.join( configDirectory, 'npmpackagejsonlint.js' )
		);

		expect( config ).not.toHaveProperty( 'extends' );
		expect( config ).toEqual(
			require( '@wordpress/npm-package-json-lint-config' )
		);
	} );
} );
