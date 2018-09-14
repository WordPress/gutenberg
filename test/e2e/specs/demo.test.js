/**
 * Internal dependencies
 */
import { visitAdmin } from '../support/utils';

describe( 'new editor state', () => {
	beforeAll( async () => {
		await visitAdmin( 'post-new.php', 'gutenberg-demo' );
	} );

	it( 'should not error', () => {
		// This test case is intentionally empty. The `beforeAll` lifecycle of
		// navigating to the Demo page is sufficient assertion in itself, as it
		// will trigger the global console error capturing if an error occurs
		// during this process.
		//
		// If any other test cases are added which verify expected behavior of
		// the demo post, this empty test case can be removed.
	} );
} );
