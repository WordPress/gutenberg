/**
 * WordPress dependencies
 */
/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Register block type hooks', () => {
	test.beforeEach( async ( { requestUtils, admin } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-register-block-type-hooks'
		);
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-register-block-type-hooks'
		);
	} );

	test( 'has a custom category for Paragraph block', async ( { page } ) => {
		await page.click( 'role=button[name="Toggle block inserter"i]' );

		expect(
			page.locator(
				'.block-editor-block-types-list[aria-label="Widgets"] > .editor-block-list-item-paragraph'
			)
		).toBeDefined();
	} );
} );
