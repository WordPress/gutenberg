/**
 * Internal dependencies
 */
import {
	META_KEY,
	newPost,
	getEditedPostContent,
	saveDraft,
	pressWithModifier,
} from '../support/utils';
import { activatePlugin, deactivatePlugin } from '../support/plugins';

describe( 'templates', () => {
	describe( 'Using a CPT with a predefined template', () => {
		beforeAll( async () => {
			await activatePlugin( 'gutenberg-test-plugin-templates' );
		} );

		beforeEach( async () => {
			await newPost( { postType: 'book' } );
		} );

		afterAll( async () => {
			await deactivatePlugin( 'gutenberg-test-plugin-templates' );
		} );

		it( 'Should add a custom post types with a predefined template', async () => {
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'Should respect user edits to not re-apply template after save (single block removal)', async () => {
			// Remove a block from the template to verify that it's not
			// re-added after saving and reloading the editor.
			await page.click( '.editor-post-title__input' );
			await page.keyboard.press( 'ArrowDown' );
			await page.keyboard.press( 'Backspace' );
			await saveDraft();
			await page.reload();

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'Should respect user edits to not re-apply template after save (full delete)', async () => {
			// Remove all blocks from the template to verify that they're not
			// re-added after saving and reloading the editor.
			await page.type( '.editor-post-title__input', 'My Empty Book' );
			await page.keyboard.press( 'ArrowDown' );
			await pressWithModifier( META_KEY, 'A' );
			await page.keyboard.press( 'Backspace' );
			await saveDraft();
			await page.reload();

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );
} );
