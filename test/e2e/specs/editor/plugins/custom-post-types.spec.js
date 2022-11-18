/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Test Custom Post Types', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-custom-post-types' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-custom-post-types'
		);
	} );

	test( 'should be able to create an hierarchical post without title support', async ( {
		admin,
		page,
	} ) => {
		const PARENT_PAGE_INPUT =
			'.editor-page-attributes__parent input:not([disabled])';
		const SUGGESTION =
			'.editor-page-attributes__parent .components-form-token-field__suggestion:first-child';

		//const check_loc =`//div[contains(@class, "edit-post-sidebar")]//button[contains(@class, "components-panel__body-toggle") and contains(text(),"t")]/ancestor::*[contains(concat(" ", @class, "Page Attribute"), " components-panel__body ")]`
		await admin.createNewPost( { postType: 'hierar-no-title' } );
		// Click block appender
		await page.click( '.block-editor-default-block-appender__content' );
		await page.keyboard.type( 'Parent Post' );
		// Publish
		await page.click( '.editor-post-publish-panel__toggle' );
		// Double check, click again on publish button
		await page.click( '.editor-post-publish-button' );
		// A success notice should show up
		page.locator( '.components-snackbar' );
		//await editor.publishPost();
		// Create child page
		await admin.createNewPost( { postType: 'hierar-no-title' } );
		//await page.pause()
		await page.click( "role=button[name='Page Attributes']" );
		await page.waitForSelector( PARENT_PAGE_INPUT );
		await page.click( PARENT_PAGE_INPUT );
		await page.waitForSelector( SUGGESTION );
		const optionToSelect = await page.locator( SUGGESTION );
		const valueToSelect = await page
			.locator( SUGGESTION )
			.allTextContents();
		await optionToSelect.click();
		await page.click( '.block-editor-default-block-appender__content' );
		await page.keyboard.type( 'Child Post' );
		await page.reload();
		await page.waitForSelector( PARENT_PAGE_INPUT );
		await expect( valueToSelect ).not.toBeNull();
	} );

	test( 'should create a cpt with a legacy block in its template without WSOD', async ( {
		admin,
		page,
	} ) => {
		await admin.createNewPost( { postType: 'leg_block_in_tpl' } );
		await page.click( '.block-editor-default-block-appender__content' );
		await page.keyboard.type( 'Hello there' );
		await page.waitForSelector( '[data-type="core/embed"]' );
		await page.click( '.editor-post-publish-panel__toggle' );
		// Double check, click again on publish button
		await page.click( '.editor-post-publish-button' );
		// A success notice should show up
		page.locator( '.components-snackbar' );
	} );
} );
