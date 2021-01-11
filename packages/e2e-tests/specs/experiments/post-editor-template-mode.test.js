/**
 * WordPress dependencies
 */
import {
	activateTheme,
	createNewPost,
	insertBlock,
	saveDraft,
	trashAllPosts,
	openPreviewPage,
	openDocumentSettingsSidebar,
} from '@wordpress/e2e-test-utils';

describe( 'Post Editor Template mode', () => {
	beforeAll( async () => {
		await activateTheme( 'tt1-blocks' );
		await trashAllPosts( 'wp_template' );
		await trashAllPosts( 'wp_template_part' );
	} );

	afterAll( async () => {
		await activateTheme( 'twentytwentyone' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'Allow to switch to template mode, edit the template and check the result', async () => {
		// Create a random post.
		await page.type( '.editor-post-title__input', 'Just an FSE Post' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Hello World' );

		// Unselect the blocks.
		await page.evaluate( () => {
			wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock();
		} );

		// Save the post
		// Saving shouldn't be necessary but unfortunately,
		// there's a template resolution bug forcing us to do so.
		await saveDraft();
		await page.reload();

		// Switch to template mode.
		await openDocumentSettingsSidebar();
		const switchLink = await page.waitForSelector(
			'.edit-post-post-template button'
		);
		await switchLink.click();

		// Check that we switched properly to edit mode.
		await page.waitForXPath(
			'//*[contains(@class, "components-snackbar")]/*[text()="Editing template. Changes made here affect all posts and pages that use the template."]'
		);
		const title = await page.$eval(
			'.edit-post-template-title',
			( el ) => el.innerText
		);
		expect( title ).toContain( 'Editing template:' );

		// Edit the template
		await insertBlock( 'Paragraph' );
		await page.keyboard.type(
			'Just a random paragraph added to the template'
		);

		// Save changes
		const doneButton = await page.waitForXPath(
			`//button[contains(text(), 'Apply')]`
		);
		await doneButton.click();
		const saveButton = await page.waitForXPath(
			`//div[contains(@class, "entities-saved-states__panel-header")]/button[contains(text(), 'Save')]`
		);
		await saveButton.click();

		// Preview changes
		const previewPage = await openPreviewPage();
		await previewPage.waitForXPath(
			'//p[contains(text(), "Just a random paragraph added to the template")]'
		);
	} );
} );
