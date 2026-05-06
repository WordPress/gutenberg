/**
 * Internal dependencies
 */
import deprecated from '../deprecated';

describe( 'Latest Posts deprecations', () => {
	it( 'migrates legacy grid layout attributes to layout support attributes', () => {
		const migratedAttributes = deprecated[ 0 ].migrate( {
			postLayout: 'grid',
			columns: 4,
			postsToShow: 3,
		} );

		expect( migratedAttributes ).toEqual( {
			layout: {
				type: 'grid',
				columnCount: 4,
			},
			postsToShow: 3,
		} );
	} );

	it( 'preserves the legacy categories migration while migrating layout', () => {
		const migratedAttributes = deprecated[ 0 ].migrate( {
			categories: '7',
			postLayout: 'grid',
			columns: 2,
		} );

		expect( migratedAttributes ).toEqual( {
			categories: [ { id: 7 } ],
			layout: {
				type: 'grid',
				columnCount: 2,
			},
		} );
	} );
} );
