/**
 * WordPress dependencies
 */
import { logged } from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { __experimentalIsEditingReusableBlock } from '../selectors';

describe( '__experimentalIsEditingReusableBlock', () => {
	afterEach( () => {
		// Reset the deprecation cache so each test observes its own warning.
		for ( const key in logged ) {
			delete logged[ key ];
		}
	} );

	it( 'gets the value for clientId', () => {
		expect(
			__experimentalIsEditingReusableBlock(
				{ isEditingReusableBlock: { 1: true } },
				1
			)
		).toBe( true );
		expect(
			__experimentalIsEditingReusableBlock(
				{ isEditingReusableBlock: { 2: false } },
				2
			)
		).toBe( false );
		expect(
			__experimentalIsEditingReusableBlock(
				{ isEditingReusableBlock: { 2: false } },
				3
			)
		).toBe( undefined );

		expect( console ).toHaveWarned();
	} );
} );
