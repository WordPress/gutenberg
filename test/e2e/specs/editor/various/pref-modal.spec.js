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
			const optionsButton = page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'buton', {
					name: 'Options',
				} );

			await optionsButton.click();

			const preferencesButton = page.getByRole( 'menuitem', {
				name: 'Preferences',
			} );

			await preferencesButton.click();

			const prePublishToggle = page.getByRole( 'label', {
				name: 'Enable pre-publish flow',
			} );

			await expect( prePublishToggle ).toBeVisible();
		} );
	} );
} );
