/**
 * Internal dependencies
 */
import convertComplementaryAreas from '../convert-complementary-areas';

describe( 'convertComplementaryAreas', () => {
	it( 'converts the `complementaryArea` property in each scope to an `isComplementaryAreaVisible` boolean', () => {
		const input = {
			'core/customize-widgets': {
				complementaryArea: 'edit-post/block',
			},
			'core/edit-site': {
				complementaryArea: 'edit-post/document',
			},
			'core/edit-post': {
				complementaryArea: 'edit-post/block',
			},
			'core/edit-widgets': {},
		};

		const expectedOutput = {
			'core/customize-widgets': {
				isComplementaryAreaVisible: true,
			},
			'core/edit-site': {
				isComplementaryAreaVisible: true,
			},
			'core/edit-post': {
				isComplementaryAreaVisible: true,
			},
			'core/edit-widgets': {},
		};

		expect( convertComplementaryAreas( input ) ).toEqual( expectedOutput );
	} );
} );
