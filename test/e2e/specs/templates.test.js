/**
 * Internal dependencies
 */
import { clickOnMoreMenuItem, newPost } from '../support/utils';
import { activatePlugin, deactivatePlugin } from '../support/plugins';

describe( 'Using a CPT with a predefined template', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-plugin-templates' );
		await newPost( { postType: 'book' } );
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-plugin-templates' );
	} );

	it( 'Should add a custom post types with a predefined template', async () => {
		//Switch to Code Editor to check HTML output
		await clickOnMoreMenuItem( 'Code Editor' );

		// Assert that the post already contains the template defined blocks
		const textEditorContent = await page.$eval( '.editor-post-text-editor', ( element ) => element.value );
		expect( textEditorContent ).toMatchSnapshot();
	} );
} );
