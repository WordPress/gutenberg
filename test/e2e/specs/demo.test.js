/**
 * Internal dependencies
 */
import { visitAdmin } from '../support/utils';

describe( 'new editor state', () => {
	beforeAll( async () => {
		await visitAdmin( 'post-new.php', 'gutenberg-demo' );
	} );

	it( 'content should load without making the post dirty', async () => {
		const isDirty = await page.evaluate( () => {
			const { select } = window.wp.data;
			return select( 'core/editor' ).isEditedPostDirty();
		} );
		expect( isDirty ).toBeFalsy();
	} );
} );
