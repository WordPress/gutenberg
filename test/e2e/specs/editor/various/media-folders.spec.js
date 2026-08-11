const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * The media folders MVP end to end: create a folder from the inserter's Media
 * tab, put images in it, and point a dynamic Gallery at it so those images
 * render in the editor and on the front end.
 *
 * Behind the `gutenberg-media-folders` experiment, which registers the
 * `wp_media_folder` taxonomy — with it off, none of this UI exists.
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
		// Folders persist across tests otherwise, and each one adds a tab to the
		// Media list that later assertions would have to work around. The route
		// only exists while the experiment is on, and a failing test can leave it
		// off — so a missing route here means there is nothing to clean up.
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

	test( 'creates a folder, adds an image to it, and shows it in a Gallery', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const media = await requestUtils.uploadMedia(
			'./assets/10x10_e2e_test_image_z9T8jK.png'
		);

		await admin.createNewPost();

		// 1. Create a folder from the Media tab.
		await page.getByLabel( 'Block Inserter' ).click();
		await page.getByRole( 'tab', { name: 'Media' } ).click();
		await page.getByRole( 'button', { name: 'Add folder' } ).click();

		const addFolderDialog = page.getByRole( 'dialog', {
			name: 'Add folder',
		} );
		await addFolderDialog.getByLabel( 'Name' ).fill( 'Holiday' );
		await addFolderDialog.getByRole( 'button', { name: 'Create' } ).click();

		// The new folder is selected as soon as its category appears, so the
		// user lands in the empty folder they just made.
		const mediaPanel = page.locator(
			'.block-editor-inserter__media-panel'
		);
		await expect(
			page.getByRole( 'tab', { name: 'Holiday' } )
		).toHaveAttribute( 'aria-selected', 'true' );
		await expect(
			mediaPanel.getByText( 'No images in this folder.' )
		).toBeVisible();

		// 2. Add an image to the folder, through the same Media Library picker
		// the "Attach images" flow uses. It opens on "Upload files", so switch
		// to the library and pick the existing image; the picker's own confirm
		// button is core's "Select" (only the modal title is ours).
		await mediaPanel
			.getByRole( 'button', { name: 'Add images to folder' } )
			.click();
		const mediaLibrary = page.getByRole( 'dialog', {
			name: 'Add images to folder',
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
		await expect(
			mediaPanel.getByRole( 'option', { name: media.title.raw } )
		).toBeVisible();

		await page.getByLabel( 'Close Block Inserter' ).click();

		// 3. Point a Gallery at the folder. An empty gallery renders only its
		// placeholder, so the source is chosen there; the folder itself is then
		// picked in the Source panel.
		await editor.insertBlock( { name: 'core/gallery' } );
		await editor.canvas
			.getByRole( 'button', { name: 'Use a folder' } )
			.click();

		await editor.openDocumentSettingsSidebar();
		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await settings.getByRole( 'tab', { name: 'Settings' } ).click();
		await settings
			.getByRole( 'combobox', { name: 'Folder' } )
			.selectOption( { label: 'Holiday' } );

		// The canvas preview resolves the folder's images.
		await expect(
			editor.canvas.locator( `.wp-block-gallery img` )
		).toHaveCount( 1 );

		// 4. The same images render on the front end.
		const postId = await editor.publishPost();
		const previewPage = await page.context().newPage();
		await previewPage.goto( `/?p=${ postId }` );

		await expect(
			previewPage.locator( '.wp-block-gallery img' )
		).toHaveCount( 1 );
		await expect(
			previewPage.locator(
				`.wp-block-gallery img.wp-image-${ media.id }`
			)
		).toBeVisible();

		await previewPage.close();
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
			page.getByRole( 'button', { name: 'Add folder' } )
		).toBeHidden();
		// The rest of the Media tab is untouched. (The built-in sources are
		// filtered out when the library is empty, so assert on the button that
		// is always there rather than on a source tab.)
		await expect(
			page.getByRole( 'button', { name: 'Open Media Library' } )
		).toBeVisible();

		await requestUtils.setGutenbergExperiments( [
			'gutenberg-media-folders',
		] );
	} );
} );
