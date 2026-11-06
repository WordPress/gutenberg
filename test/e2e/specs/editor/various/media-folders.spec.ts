import { test, expect } from '@wordpress/e2e-test-utils-playwright';

type MediaFolder = { id: number; name: string };

/**
 * The media folders prototype end to end: create a folder from the inserter's
 * Media tab, file an image into it, take it back out, and point a dynamic
 * Gallery at the folder so its images render in the editor and on the front
 * end.
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
		// Folders persist across tests otherwise. The route only exists while
		// the experiment is on, and a failing test can leave it off — so a
		// missing route here means there is nothing to clean up.
		let folders: MediaFolder[] = [];
		try {
			folders = await requestUtils.rest< MediaFolder[] >( {
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

	test( 'creates a folder, files an image into it and takes it out again', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const media = await requestUtils.uploadMedia(
			'./assets/10x10_e2e_test_image_z9T8jK.png'
		);

		await admin.createNewPost();

		// The Media library source opens by default and carries the filter.
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

		// 2. File the uploaded image into it through the Media Library picker,
		// which replaces the attach button while a folder is being browsed. It
		// opens on "Upload files", so switch to the library and pick the
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
		// `exact` so this is the modal's confirm button, not the selected
		// item's own "Select"/"Deselect" toggle.
		await mediaLibrary
			.getByRole( 'button', { name: 'Select', exact: true } )
			.click();

		await expect(
			page
				.locator( '.components-snackbar__content' )
				.filter( { hasText: 'added to Holiday' } )
		).toBeVisible();
		// The card's media area is the click-to-insert target, named by the
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

	test( 'shows a folder in a dynamic Gallery, in the editor and on the front end', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const media = await requestUtils.uploadMedia(
			'./assets/10x10_e2e_test_image_z9T8jK.png'
		);
		const folder = await requestUtils.rest< MediaFolder >( {
			method: 'POST',
			path: '/wp/v2/media-folders',
			data: { name: 'Holiday' },
		} );
		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/media/${ media.id }`,
			data: { 'media-folders': [ folder.id ] },
		} );

		await admin.createNewPost();

		// An empty gallery renders only its placeholder, so the source is
		// chosen there; the folder itself is then picked in the Source panel.
		await editor.insertBlock( { name: 'core/gallery' } );
		await editor.canvas
			.getByRole( 'button', { name: 'Use a folder' } )
			.click();

		await editor.openDocumentSettingsSidebar();
		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await settings.getByRole( 'tab', { name: 'Settings' } ).click();
		await settings.getByRole( 'combobox', { name: 'Folder' } ).click();
		await page.getByRole( 'option', { name: 'Holiday' } ).click();

		// The canvas preview resolves the folder's images.
		await expect(
			editor.canvas.locator( '.wp-block-gallery img' )
		).toHaveCount( 1 );

		// The same image renders on the front end, where the folder is resolved
		// by the PHP source resolver rather than the editor's REST query.
		const postId = await editor.publishPost();
		const previewPage = await page.context().newPage();
		await previewPage.goto( `/?p=${ postId }` );

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
			page.getByRole( 'combobox', { name: 'Folder' } )
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
