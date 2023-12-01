/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Preferences modal', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { admin } ) => {
		await admin.trashPost();
	} );

	test.describe( 'Preferences modal adaps to viewport', () => {
		test( 'Enable pre-publish flow is visible on desktop ', async ( {
			page,
		} ) => {
			await page.click(
				'role=region[name="Editor top bar"i] >> role=button[name="Options"i]'
			);
			await page.click( 'role=menuitem[name="Preferences"i]' );

			const prePublishToggle = page.locator(
				'role=label[name="Enable pre-publish flow"i]'
			);

			await expect( prePublishToggle ).toBeVisible();
		} );
	} );
} );
