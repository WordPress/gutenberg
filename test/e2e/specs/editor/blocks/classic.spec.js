/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs/promises' );
const os = require( 'os' );
const { v4: uuid } = require( 'uuid' );

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	mediaUtils: async ( { page }, use ) => {
		await use( new MediaUtils( { page } ) );
	},
} );

test.describe( 'Classic', () => {
	test.beforeEach( async ( { admin, editor } ) => {
		await admin.createNewPost();
		// To do: run with iframe.
		await editor.switchToLegacyCanvas();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'should be inserted', async ( { editor, page, pageUtils } ) => {
		await editor.insertBlock( { name: 'core/freeform' } );
		// Ensure there is focus.
		await page.click( '.mce-content-body' );
		await page.keyboard.type( 'test' );
		// Move focus away.
		await pageUtils.pressKeys( 'shift+Tab' );

		await expect.poll( editor.getEditedPostContent ).toBe( 'test' );
	} );

	test( 'should insert media, convert to blocks, and undo in one step', async ( {
		editor,
		mediaUtils,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/freeform' } );
		// Ensure there is focus.
		await page.click( '.mce-content-body' );
		await page.keyboard.type( 'test' );

		await page.getByRole( 'button', { name: /Add Media/i } ).click();

		const modalGalleryTab = page.getByRole( 'tab', {
			name: 'Create gallery',
		} );

		await expect( modalGalleryTab ).toBeVisible();
		await modalGalleryTab.click();

		const filename = await mediaUtils.upload(
			page.locator( '.media-modal .moxie-shim input[type=file]' )
		);

		// Wait for upload
		await expect(
			page.locator( `role=checkbox[name="${ filename }"i]` )
		).toBeChecked();

		const createGallery = page.getByRole( 'button', {
			name: 'Create a new gallery',
		} );
		await expect( createGallery ).toBeEnabled();
		await createGallery.click();
		await page.click( 'role=button[name="Insert gallery"i]' );

		await pageUtils.pressKeys( 'shift+Tab' );
		await expect
			.poll( editor.getEditedPostContent )
			.toMatch( /\[gallery ids=\"\d+\"\]/ );

		await editor.clickBlockToolbarButton( 'Convert to blocks' );
		const galleryBlock = page.locator(
			'role=document[name="Block: Gallery"i]'
		);
		await expect( galleryBlock ).toBeVisible();

		// Check that you can undo back to a Classic block gallery in one step.
		await pageUtils.pressKeys( 'primary+z' );
		await expect(
			page.locator( 'role=document[name="Block: Classic"i]' )
		).toBeVisible();
		await expect
			.poll( editor.getEditedPostContent )
			.toMatch( /\[gallery ids=\"\d+\"\]/ );

		await editor.clickBlockToolbarButton( 'Convert to blocks' );
		await expect
			.poll( editor.getEditedPostContent )
			.toMatch( /<!-- wp:gallery/ );
	} );

	test( 'Should not fail after save/reload', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Based on docs routing diables caching.
		// See: https://playwright.dev/docs/api/class-page#page-route
		await page.route( '**', async ( route ) => {
			await route.continue();
		} );

		await editor.insertBlock( { name: 'core/freeform' } );
		// Ensure there is focus.
		await page.click( '.mce-content-body' );
		await page.keyboard.type( 'test' );
		// Move focus away.
		await pageUtils.pressKeys( 'shift+Tab' );

		await editor.saveDraft();
		await page.reload();
		await page.unroute( '**' );

		// To do: run with iframe.
		await editor.switchToLegacyCanvas();

		const errors = [];
		page.on( 'pageerror', ( exception ) => {
			errors.push( exception );
		} );

		const classicBlock = page.locator(
			'role=document[name="Block: Classic"i]'
		);

		await expect( classicBlock ).toBeVisible();
		await classicBlock.click();

		expect( errors.length ).toBe( 0 );
		await expect.poll( editor.getEditedPostContent ).toBe( 'test' );
	} );
} );

class MediaUtils {
	constructor( { page } ) {
		this.page = page;

		this.TEST_IMAGE_FILE_PATH = path.join(
			__dirname,
			'..',
			'..',
			'..',
			'assets',
			'10x10_e2e_test_image_z9T8jK.png'
		);
	}

	async upload( inputElement ) {
		const tmpDirectory = await fs.mkdtemp(
			path.join( os.tmpdir(), 'gutenberg-test-image-' )
		);
		const filename = uuid();
		const tmpFileName = path.join( tmpDirectory, filename + '.png' );
		await fs.copyFile( this.TEST_IMAGE_FILE_PATH, tmpFileName );

		await inputElement.setInputFiles( tmpFileName );

		return filename;
	}
}
