/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Preferences modal', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.describe( 'Preferences modal adaps to viewport', () => {
		test( 'Enable pre-publish checks is visible on desktop ', async ( {
			page,
		} ) => {
			await page.click(
				'role=region[name="Editor top bar"i] >> role=button[name="Options"i]'
			);
			await page.click( 'role=menuitem[name="Preferences"i]' );

			const prePublishToggle = page.locator(
				'role=checkbox[name="Enable pre-publish checks"i]'
			);

			await expect( prePublishToggle ).toBeVisible();
		} );
	} );
	test.describe( 'Preferences modal adaps to viewport', () => {
		test( 'Enable pre-publish checks is not visible on mobile ', async ( {
			page,
		} ) => {
			await page.setViewportSize( { width: 500, height: 800 } );

			await page.click(
				'role=region[name="Editor top bar"i] >> role=button[name="Options"i]'
			);
			await page.click( 'role=menuitem[name="Preferences"i]' );

			const generalButton = page.locator(
				'role=button[name="General"i]'
			);

			const generalTabPanel = page.locator(
				'role=tabPanel[name="General"i]'
			);

			const prePublishToggle = page.locator(
				'role=checkbox[name="Enable pre-publish checks"i]'
			);

			await expect( generalButton ).toBeVisible();
			await expect( generalTabPanel ).toBeHidden();
			await expect( prePublishToggle ).toBeHidden();
		} );
	} );
} );
