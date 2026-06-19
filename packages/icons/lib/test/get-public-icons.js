/**
 * Internal dependencies
 */
import { getPublicIcons } from '../get-public-icons.cjs';

describe( 'getPublicIcons', () => {
	it( 'returns only entries marked public: true', () => {
		const manifest = [
			{ slug: 'a', public: true },
			{ slug: 'b' },
			{ slug: 'c', public: false },
			{ slug: 'd', public: true },
		];

		expect( getPublicIcons( manifest ).map( ( i ) => i.slug ) ).toEqual( [
			'a',
			'd',
		] );
	} );

	it( 'returns an empty array when no entry is public', () => {
		expect( getPublicIcons( [ { slug: 'a' }, { slug: 'b' } ] ) ).toEqual(
			[]
		);
	} );
} );
