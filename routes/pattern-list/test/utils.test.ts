import { describe, expect, it } from 'vitest';
import { filterOutDuplicatesByName } from '../utils';

describe( 'filterOutDuplicatesByName', () => {
	it( 'keeps the first pattern for each name', () => {
		const first = { name: 'theme/hero', title: 'First' };
		const second = { name: 'theme/footer', title: 'Footer' };
		const duplicate = { name: 'theme/hero', title: 'Duplicate' };

		expect(
			filterOutDuplicatesByName( [ first, second, duplicate ] )
		).toEqual( [ first, second ] );
	} );

	it( 'returns an empty list for an empty list', () => {
		expect( filterOutDuplicatesByName( [] ) ).toEqual( [] );
	} );
} );
