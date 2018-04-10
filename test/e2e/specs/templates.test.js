/**
 * Internal dependencies
 */
import '../support/bootstrap';
import { newPost, newDesktopBrowserPage } from '../support/utils';
import { activatePlugin, deactivatePlugin } from '../support/plugins';

describe( 'Using a CPT with a predefined template', () => {
	beforeAll( async () => {
		await newDesktopBrowserPage();
		await activatePlugin( 'gutenberg-test-plugin-templates' );
		await newPost( 'book' );
	} );

	afterAll( async () => {
		await newDesktopBrowserPage();
		await deactivatePlugin( 'gutenberg-test-plugin-templates' );
	} );

	it( 'Should add a custom post types with a predefined template', async () => {
		//Switch to Code Editor to check HTML output
		await page.click( '.edit-post-more-menu [aria-label="More"]' );
		const codeEditorButton = ( await page.$x( '//button[contains(text(), \'Code Editor\')]' ) )[ 0 ];
		await codeEditorButton.click( 'button' );

		// Assert that the post already contains the template defined blocks
		const textEditorContent = await page.$eval( '.editor-post-text-editor', ( element ) => element.value );
		expect( textEditorContent ).toMatchSnapshot();
	} );
} );
