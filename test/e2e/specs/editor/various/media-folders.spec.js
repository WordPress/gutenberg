const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Media folders in the inserter's Media tab, behind the
 * `gutenberg-media-folders` experiment: create a folder, file an image into
 * it, browse it, and take the image back out.
 */
test.describe( 'Media folders', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-media-folders',
		] );
		await Promise.all( [
			requestUtils.deleteAllMedia(),
			requestUtils.deleteAllPosts(),
		] );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		// Folders persist across tests otherwise. The route only exists while
		// the experiment is on, and a failing test can leave it off — so a
		// missing route here means there is nothing to clean up.
		let folders;
		try {
			folders = await requestUtils.rest( {
				path: '/wp/v2/media-folders',
				params: { per_page: 100 },
			} );
		} catch {
			return;
		}
		await Promise.all(
			folders.map( ( folder ) =>
				requestUtils.rest( {
					method: 'DELETE',
					path: `/wp/v2/media-folders/${ folder.id }`,
					params: { force: true },
				} )
			)
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllMedia(),
			requestUtils.deleteAllPosts(),
		] );
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'creates a folder, files an image into it and removes it again', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const media = await requestUtils.uploadMedia(
			'./assets/10x10_e2e_test_image_z9T8jK.png'
		);

		await admin.createNewPost();

		// The Images source opens by default and carries the folder filter.
		await page.getByLabel( 'Block Inserter' ).click();
		await page.getByRole( 'tab', { name: 'Media' } ).click();
		const mediaPanel = page.locator(
			'.block-editor-inserter__media-panel'
		);
		const folderFilter = mediaPanel.getByRole( 'combobox', {
			name: 'Folder',
		} );
		await expect( folderFilter ).toHaveText( 'All folders' );

		// 1. Create a folder.
		await mediaPanel.getByRole( 'button', { name: 'New folder' } ).click();
		const newFolderDialog = page.getByRole( 'dialog', {
			name: 'New folder',
		} );
		await newFolderDialog.getByLabel( 'Name' ).fill( 'Holiday' );
		await newFolderDialog.getByRole( 'button', { name: 'Create' } ).click();

		// The new folder is selected straight away, so the user lands in the
		// empty folder they just made.
		await expect( folderFilter ).toHaveText( 'Holiday' );
		await expect(
			mediaPanel.getByText( 'This folder is empty.' )
		).toBeVisible();

		// 2. File the uploaded image into it through the Media Library picker.
		// It opens on "Upload files", so switch to the library and pick the
		// existing image; the picker's own confirm button is core's "Select".
		await mediaPanel
			.getByRole( 'button', { name: 'Add to folder' } )
			.click();
		const mediaLibrary = page.getByRole( 'dialog', {
			name: 'Add to folder',
		} );
		await mediaLibrary
			.getByRole( 'tab', { name: 'Media Library' } )
			.click();
		await mediaLibrary
			.getByRole( 'checkbox', { name: media.title.raw } )
			.click();
		// `exact` so this is the modal's confirm button, not the selected item's
		// own "Select"/"Deselect" toggle.
		await mediaLibrary
			.getByRole( 'button', { name: 'Select', exact: true } )
			.click();

		await expect(
			page
				.locator( '.components-snackbar__content' )
				.filter( { hasText: 'added to Holiday' } )
		).toBeVisible();
		// The card's preview is the click-to-insert target, named by the
		// item's title.
		const filedImage = mediaPanel.getByRole( 'button', {
			name: media.title.raw,
		} );
		await expect( filedImage ).toBeVisible();

		// 3. Take it out again through the card's actions menu.
		await filedImage.hover();
		await mediaPanel.getByRole( 'button', { name: 'Actions' } ).click();
		await page
			.getByRole( 'menuitem', { name: 'Remove from folder' } )
			.click();

		await expect(
			page
				.locator( '.components-snackbar__content' )
				.filter( { hasText: 'removed from Holiday' } )
		).toBeVisible();
		await expect( filedImage ).toBeHidden();
		await expect(
			mediaPanel.getByText( 'This folder is empty.' )
		).toBeVisible();

		// 4. Back to all folders, the image is still in the library.
		await folderFilter.click();
		await page.getByRole( 'option', { name: 'All folders' } ).click();
		await expect( filedImage ).toBeVisible();
	} );

	test( 'hides the folder affordances when the experiment is off', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await requestUtils.setGutenbergExperiments( [] );

		await admin.createNewPost();
		await page.getByLabel( 'Block Inserter' ).click();
		await page.getByRole( 'tab', { name: 'Media' } ).click();

		await expect(
			page.getByRole( 'combobox', { name: 'Folder' } )
		).toBeHidden();
		// The rest of the Media tab is untouched.
		await expect(
			page.getByRole( 'button', { name: 'Open Media Library' } )
		).toBeVisible();

		await requestUtils.setGutenbergExperiments( [
			'gutenberg-media-folders',
		] );
	} );
} );
