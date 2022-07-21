/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	deactivatePlugin,
	createNewPost,
	createUser,
	deleteUser,
} from '@wordpress/e2e-test-utils';

describe( 'autocomplete mentions', () => {
	beforeAll( async () => {
		await createUser( 'testuser', { firstName: 'Jane', lastName: 'Doe' } );
		await activatePlugin( 'gutenberg-test-autocompleter' );
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-autocompleter' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	afterAll( async () => {
		await deleteUser( 'testuser' );
	} );
} );
