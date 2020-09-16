/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	clickOnCloseModalButton,
	createNewPost,
	deactivatePlugin,
	openDocumentSettingsSection,
	publishPost,
} from '@wordpress/e2e-test-utils';

const SELECT_OPTION_SELECTOR =
	'.editor-page-attributes__parent option:nth-child(2)';

describe( 'Test Custom Post Types', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-custom-post-types' );
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-custom-post-types' );
	} );

	it( 'It should be able to create an hierarchical post without title support', async () => {
		// Create a parent post.
		await createNewPost( { postType: 'hierar-no-title' } );
		await page.click( '.block-editor-writing-flow' );
		await page.keyboard.type( 'Parent Post' );
		await publishPost();
		// Create a post that is a child of the previously created post.
		await createNewPost( { postType: 'hierar-no-title' } );
		await openDocumentSettingsSection( 'Page Attributes' );
		await page.waitForSelector( SELECT_OPTION_SELECTOR );
		const optionToSelect = await page.$( SELECT_OPTION_SELECTOR );
		const valueToSelect = await (
			await optionToSelect.getProperty( 'value' )
		 ).jsonValue();
		await page.select(
			'.editor-page-attributes__parent select',
			valueToSelect
		);
		// Close document settings modal.
		await clickOnCloseModalButton();
		await page.click( '.block-editor-writing-flow' );
		await page.keyboard.type( 'Child Post' );
		await publishPost();
		// Reload the child post and verify it is still correctly selected as a child post.
		await page.reload();
		await openDocumentSettingsSection( 'Page Attributes' );
		await page.waitForSelector( SELECT_OPTION_SELECTOR );
		const selectedValue = await page.$eval(
			'.editor-page-attributes__parent select',
			( el ) => el.value
		);
		expect( selectedValue ).toEqual( valueToSelect );
	} );
} );
