import { describe, expect, it } from 'vitest';
import { inferStyleDependencies } from '../style-dependencies.mjs';

describe( 'inferStyleDependencies()', () => {
	it( 'keeps the script dependencies that this build registers a style for', () => {
		const deps = inferStyleDependencies(
			[ 'react', 'wp-components', 'wp-data', 'wp-media-utils' ],
			new Set( [ 'wp-components', 'wp-edit-site', 'wp-media-utils' ] )
		);

		expect( deps ).toEqual( [ 'wp-components', 'wp-media-utils' ] );
	} );

	it( 'returns no dependencies without script dependencies', () => {
		expect(
			inferStyleDependencies( undefined, new Set( [ 'wp-components' ] ) )
		).toEqual( [] );
	} );
} );
