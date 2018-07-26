/**
 * Internal dependencies
 */
import '../support/bootstrap';
import { visitAdmin, newDesktopBrowserPage } from '../support/utils';

describe( 'classic editor', () => {
	beforeAll( async () => {
		await newDesktopBrowserPage();
		await visitAdmin( 'post-new.php', 'classic-editor' );
	} );

	it( 'Should work properly', async () => {
		// Click visual editor
		await page.click( '#content-tmce' );
		await page.click( '#content_ifr' );

		// type some random text
		await page.keyboard.type( 'Typing in classic editor' );

		// Switch to HTML mode
		await page.click( '#content-html' );

		const textEditorContent = await page.$eval( '.wp-editor-area', ( element ) => element.value );
		expect( textEditorContent ).toEqual( 'Typing in classic editor' );
	} );

	it( 'Should have wpautop disabled on a post containing blocks', async () => {
		// Click the Text mode.
		await page.click( '#content-html' );

		// Enter some block text.
		const original = `<!-- wp:paragraph -->
<p>Foo bar four five six</p>
<!-- /wp:paragraph -->

This is another set of text`;
		await page.keyboard.type( original );

		// Save the post so that TinyMCE loads with wpautop disabled.
		await page.click( '#save-post' );

		// Switch to Visual mode.
		await page.click( '#content-tmce' );
		await page.click( '#content_ifr' );

		// Switch back to Text mode.
		await page.click( '#content-html' );

		// Expected text is wrapped in `<p>` because `removep()` isn't run
		// when switching out of Visual mode.
		const expected = `<!-- wp:paragraph -->
<p>Foo bar four five six</p>
<!-- /wp:paragraph -->
<p>This is another set of text</p>`;
		const textEditorContent = await page.$eval( '.wp-editor-area', ( element ) => element.value );
		expect( textEditorContent ).toEqual( expected );
	} );
} );
