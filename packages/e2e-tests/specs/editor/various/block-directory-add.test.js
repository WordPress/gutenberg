/**
 * WordPress dependencies
 */
import {
	createNewPost,
} from '@wordpress/e2e-test-utils';

describe( 'adding blocks', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'Should add block to document.', async () => {
		expect( false ).toBe( true );
	} );
} );
