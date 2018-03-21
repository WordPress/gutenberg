/**
 * Internal dependencies
 */
import '../support/bootstrap';
import { newPost, visitAdmin } from '../support/utils';

// Tests
describe( 'hello', () => {
	beforeAll( async () => {
		await newPost();
	} );

	it( 'Should show the New Post Page in Gutenberg', async () => {
		expect( page.url() ).toEqual( expect.stringContaining( 'post-new.php' ) );
		const title = await page.$( '[placeholder="Add title"]' );
		expect( title ).not.toBeNull();
	} );

	it( 'Should have no history', async () => {
		const undoButton = await page.$( '.editor-history__undo:not( :disabled )' );
		const redoButton = await page.$( '.editor-history__redo:not( :disabled )' );

		expect( undoButton ).toBeNull();
		expect( redoButton ).toBeNull();
	} );

	it( 'Should not prompt to confirm unsaved changes', async () => {
		await visitAdmin( 'edit.php' );
		expect( page.url() ).not.toEqual( expect.stringContaining( 'post-new.php' ) );
	} );
} );
