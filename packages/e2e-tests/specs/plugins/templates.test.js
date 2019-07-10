/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	clickBlockAppender,
	createNewPost,
	deactivatePlugin,
	getEditedPostContent,
	pressKeyWithModifier,
	saveDraft,
	switchUserToAdmin,
	switchUserToTest,
	visitAdminPage,
	switchToEditMode,
} from '@wordpress/e2e-test-utils';

describe( 'templates', () => {
	describe( 'Using a CPT with a predefined template', () => {
		beforeAll( async () => {
			await activatePlugin( 'gutenberg-test-plugin-templates' );
		} );

		beforeEach( async () => {
			await createNewPost( { postType: 'book' } );
			await switchToEditMode();
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
			await pressKeyWithModifier( 'primary', 'A' );
			await page.keyboard.press( 'Backspace' );
			await saveDraft();
			await page.reload();

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );

	describe( 'With default post format assigned', () => {
		const STANDARD_FORMAT_VALUE = '0';

		async function setPostFormat( format ) {
			// To set the post format, we need to be the admin user.
			await switchUserToAdmin();
			await visitAdminPage( 'options-writing.php' );
			await page.select( '#default_post_format', format );
			await Promise.all( [
				page.waitForNavigation(),
				page.click( '#submit' ),
			] );
			await switchUserToTest();
		}

		beforeAll( async () => {
			await activatePlugin( 'gutenberg-test-plugin-post-formats-support' );
			await setPostFormat( 'image' );
		} );
		afterAll( async () => {
			await setPostFormat( STANDARD_FORMAT_VALUE );
			await deactivatePlugin( 'gutenberg-test-plugin-post-formats-support' );
		} );

		it( 'should populate new post with default block for format', async () => {
			await createNewPost();

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'should not populate edited post with default block for format', async () => {
			await createNewPost();

			// Remove the default block template to verify that it's not
			// re-added after saving and reloading the editor.
			await page.type( '.editor-post-title__input', 'My Image Format' );
			await clickBlockAppender();
			await page.keyboard.press( 'Backspace' );
			await page.keyboard.press( 'Backspace' );
			await saveDraft();
			await page.reload();

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'should not populate new page with default block for format', async () => {
			// This test always needs to run as the admin user, because other roles can't create pages.
			// It can't be skipped, because then it failed because of not testing the snapshot.
			await switchUserToAdmin();
			await createNewPost( { postType: 'page' } );

			expect( await getEditedPostContent() ).toMatchSnapshot();
			await switchUserToTest();
		} );
	} );
} );
