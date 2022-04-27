/**
 * WordPress dependencies
 */
import { __experimentalGetCoreBlocks } from '@wordpress/block-library';

describe( 'text', () => {
	it( 'a', () => {
		console.log(
			__experimentalGetCoreBlocks().map( ( block ) => block?.metadata )
		);
		expect( 1 ).toBe( 1 );
	} );
} );
