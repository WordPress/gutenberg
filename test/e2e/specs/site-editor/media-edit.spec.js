/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Helper to select an existing file from the media library modal.
 *
 * @param {Object}  page         Playwright page object.
 * @param {number}  index        Index of the attachment to select (default 0).
 * @param {boolean} experimental Whether using experimental DataViews modal.
 */
async function selectMediaFromLibrary( page, index = 0, experimental = false ) {
	const mediaLibrary = page.getByRole( 'dialog' );
	if ( experimental ) {
		const listbox = mediaLibrary.getByRole( 'listbox' );
		await listbox.getByRole( 'option' ).nth( index ).click();
	} else {
		await mediaLibrary.locator( '.attachment' ).nth( index ).waitFor();
		await mediaLibrary.locator( '.attachment' ).nth( index ).click();
	}
	await mediaLibrary
		.getByRole( 'button', { name: 'Select', exact: true } )
		.click();
}

/**
 * Helper to navigate to the Pages list and open quick edit for a page.
 *
 * @param {Object} page      Playwright page object.
 * @param {Object} admin     Admin utilities.
 * @param {string} pageTitle Title of the page to select.
 */
async function openQuickEditForPage( page, admin, pageTitle ) {
	await admin.visitSiteEditor();
	await page.getByRole( 'button', { name: 'Pages' } ).click();
	await page.getByRole( 'button', { name: 'Layout' } ).click();
	await page.getByRole( 'menuitemradio', { name: 'Table' } ).click();
	await page.getByRole( 'checkbox', { name: pageTitle } ).check();
	await page.getByRole( 'button', { name: 'Details' } ).click();
}

[ false, true ].forEach( ( useExperimentalModal ) => {
	const suffix = useExperimentalModal ? ' (experimental modal)' : '';

	test.describe( `MediaEdit control with multiple files${ suffix }`, () => {
		let testPageId;
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'emptytheme' );
			await requestUtils.activatePlugin( 'gutenberg-test-media-edit' );
			const experiments = [ 'gutenberg-quick-edit-dataviews' ];
			if ( useExperimentalModal ) {
				experiments.push( 'gutenberg-dataviews-media-modal' );
			}
			await requestUtils.setGutenbergExperiments( experiments );
			await Promise.all( [
				requestUtils.deleteAllMedia(),
				requestUtils.deleteAllPages(),
			] );
			await Promise.all( [
				requestUtils.uploadMedia(
					path.resolve(
						process.cwd(),
						'test/e2e/assets/10x10_e2e_test_image_z9T8jK.png'
					)
				),
				requestUtils.uploadMedia(
					path.resolve(
						process.cwd(),
						'test/e2e/assets/test-file.txt'
					)
				),
			] );
			const testPage = await requestUtils.createPage( {
				title: 'Media Test Page',
				status: 'publish',
			} );
			testPageId = testPage.id;
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await Promise.all( [
				requestUtils.setGutenbergExperiments( [] ),
				requestUtils.deactivatePlugin( 'gutenberg-test-media-edit' ),
				requestUtils.deleteAllMedia(),
				requestUtils.deleteAllPages(),
			] );
		} );

		test.beforeEach( async ( { requestUtils } ) => {
			await requestUtils.rest( {
				path: `/wp/v2/pages/${ testPageId }`,
				method: 'POST',
				data: { meta: { featured_media_test: [] } },
			} );
		} );

		test( 'should add a file to featured image field', async ( {
			page,
			admin,
		} ) => {
			await openQuickEditForPage( page, admin, 'Media Test Page' );
			const featuredImageSection = page.locator(
				'fieldset.media-utils__media-edit[data-field-id="featured_media"]'
			);
			await featuredImageSection.getByText( 'Add files…' ).click();
			await selectMediaFromLibrary( page, 0, useExperimentalModal );
			await expect(
				featuredImageSection.locator( '.media-utils__media-edit-row' )
			).toBeVisible();
			await expect(
				featuredImageSection.getByText( 'Add files' )
			).toBeVisible();
		} );

		test( 'should add multiple files to featured image field', async ( {
			page,
			admin,
		} ) => {
			await openQuickEditForPage( page, admin, 'Media Test Page' );
			const featuredImageSection = page.locator(
				'fieldset.media-utils__media-edit[data-field-id="featured_media"]'
			);
			await featuredImageSection.getByText( 'Add files…' ).click();
			await selectMediaFromLibrary( page, 0, useExperimentalModal );
			await expect(
				featuredImageSection.locator( '.media-utils__media-edit-row' )
			).toHaveCount( 1 );
			await featuredImageSection.getByText( 'Add files' ).click();
			await selectMediaFromLibrary( page, 1, useExperimentalModal );
			await expect(
				featuredImageSection.locator( '.media-utils__media-edit-row' )
			).toHaveCount( 2 );
		} );

		test( 'should remove a file from featured image field', async ( {
			page,
			admin,
		} ) => {
			await openQuickEditForPage( page, admin, 'Media Test Page' );
			const featuredImageSection = page.locator(
				'fieldset.media-utils__media-edit[data-field-id="featured_media"]'
			);
			await featuredImageSection.getByText( 'Add files…' ).click();
			await selectMediaFromLibrary( page, 0, useExperimentalModal );
			await expect(
				featuredImageSection.locator( '.media-utils__media-edit-row' )
			).toBeVisible();
			await featuredImageSection
				.getByRole( 'button', { name: 'Remove' } )
				.click();
			await expect(
				featuredImageSection.locator( '.media-utils__media-edit-row' )
			).toBeHidden();
			await expect(
				featuredImageSection.getByText( 'Add files…' )
			).toBeVisible();
		} );

		test( 'should persist multiple files after save and page refresh', async ( {
			page,
			admin,
		} ) => {
			await openQuickEditForPage( page, admin, 'Media Test Page' );
			const featuredImageSection = page.locator(
				'fieldset.media-utils__media-edit[data-field-id="featured_media"]'
			);
			await featuredImageSection.getByText( 'Add files…' ).click();
			await selectMediaFromLibrary( page, 0, useExperimentalModal );
			await featuredImageSection.getByText( 'Add files' ).click();
			await selectMediaFromLibrary( page, 1, useExperimentalModal );
			await expect(
				featuredImageSection.locator( '.media-utils__media-edit-row' )
			).toHaveCount( 2 );
			const saveButton = page.getByRole( 'button', {
				name: /Review.*change/i,
			} );
			await saveButton.click();
			await page.getByRole( 'button', { name: 'Save' } ).click();
			await expect( saveButton ).toBeHidden( { timeout: 10000 } );
			await openQuickEditForPage( page, admin, 'Media Test Page' );
			const featuredImageAfterRefresh = page.locator(
				'fieldset.media-utils__media-edit[data-field-id="featured_media"]'
			);
			await expect(
				featuredImageAfterRefresh.locator(
					'.media-utils__media-edit-row'
				)
			).toHaveCount( 2 );
		} );

		test( 'should remove one file while keeping others', async ( {
			page,
			admin,
		} ) => {
			await openQuickEditForPage( page, admin, 'Media Test Page' );
			const featuredImageSection = page.locator(
				'fieldset.media-utils__media-edit[data-field-id="featured_media"]'
			);
			await featuredImageSection.getByText( 'Add files…' ).click();
			await selectMediaFromLibrary( page, 0, useExperimentalModal );
			await featuredImageSection.getByText( 'Add files' ).click();
			await selectMediaFromLibrary( page, 1, useExperimentalModal );
			await expect(
				featuredImageSection.locator( '.media-utils__media-edit-row' )
			).toHaveCount( 2 );
			await featuredImageSection
				.locator( '.media-utils__media-edit-row' )
				.first()
				.getByRole( 'button', { name: 'Remove' } )
				.click();
			await expect(
				featuredImageSection.locator( '.media-utils__media-edit-row' )
			).toHaveCount( 1 );
			await expect(
				featuredImageSection.getByText( 'Add files' )
			).toBeVisible();
		} );
	} );
} );
