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
	test.beforeAll( async ( { requestUtils } ) => {
		// Cross-origin isolation (COEP) prevents TinyMCE from
		// initializing properly in its iframe.
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-disable-client-side-media-processing'
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-disable-client-side-media-processing'
		);
		await requestUtils.deleteAllMedia();
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should be inserted', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/freeform' } );
		await editor.canvas
			.getByRole( 'button', { name: 'Edit contents' } )
			.click();
		const tinymceFrame = page.frameLocator(
			'iframe[title*="Rich Text Area"]'
		);
		await tinymceFrame.locator( '.mce-content-body' ).click();
		await page.keyboard.type( 'test' );
		await page.getByRole( 'button', { name: 'Save' } ).click();

		await expect.poll( editor.getEditedPostContent ).toBe( 'test' );
	} );

	test( 'should insert media, convert to blocks, and undo in one step', async ( {
		editor,
		mediaUtils,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/freeform' } );
		await editor.canvas
			.getByRole( 'button', { name: 'Edit contents' } )
			.click();
		const tinymceFrame = page.frameLocator(
			'iframe[title*="Rich Text Area"]'
		);
		await tinymceFrame.locator( '.mce-content-body' ).click();
		await page.keyboard.type( 'test' );

		await page.getByRole( 'button', { name: /Add Media/i } ).click();

		const modalGalleryTab = page.getByRole( 'tab', {
			name: 'Create gallery',
		} );

		await expect( modalGalleryTab ).toBeVisible();
		await modalGalleryTab.click();

		const fileName = await mediaUtils.upload(
			page.locator( '.media-modal .moxie-shim input[type=file]' )
		);

		// Wait for upload (increased timeout for client-side media processing).
		await expect(
			page.getByRole( 'checkbox', { name: fileName } )
		).toBeChecked( { timeout: 30_000 } );

		const createGallery = page.getByRole( 'button', {
			name: 'Create a new gallery',
		} );
		await expect( createGallery ).toBeEnabled();
		await createGallery.click();
		await page.getByRole( 'button', { name: 'Insert gallery' } ).click();

		await page.getByRole( 'button', { name: 'Save' } ).click();
		await expect
			.poll( editor.getEditedPostContent )
			.toMatch( /\[gallery ids=\"\d+\"\]/ );

		await editor.clickBlockToolbarButton( 'Convert to blocks' );
		const galleryBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Gallery',
		} );
		await expect( galleryBlock ).toBeVisible();

		// Check that you can undo back to a Classic block gallery in one step.
		await pageUtils.pressKeys( 'primary+z' );
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Classic' } )
		).toBeVisible();
		await expect
			.poll( editor.getEditedPostContent )
			.toMatch( /\[gallery ids=\"\d+\"\]/ );

		await editor.clickBlockToolbarButton( 'Convert to blocks' );
		await expect
			.poll( editor.getEditedPostContent )
			.toMatch( /<!-- wp:gallery/ );
	} );

	test( 'Should not fail after save/reload', async ( { editor, page } ) => {
		// Based on docs routing disables caching.
		// See: https://playwright.dev/docs/api/class-page#page-route
		await page.route( '**', async ( route ) => {
			await route.continue();
		} );

		await editor.insertBlock( { name: 'core/freeform' } );
		await editor.canvas
			.getByRole( 'button', { name: 'Edit contents' } )
			.click();
		const tinymceFrame = page.frameLocator(
			'iframe[title*="Rich Text Area"]'
		);
		await tinymceFrame.locator( '.mce-content-body' ).click();
		await page.keyboard.type( 'test' );
		await page.getByRole( 'button', { name: 'Save' } ).click();

		await editor.saveDraft();
		await page.reload();
		await page.unroute( '**' );

		const errors = [];
		page.on( 'pageerror', ( exception ) => {
			errors.push( exception );
		} );

		const classicBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Classic',
		} );

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
		const fileName = uuid();
		const tmpFileName = path.join( tmpDirectory, fileName + '.png' );
		await fs.copyFile( this.TEST_IMAGE_FILE_PATH, tmpFileName );

		await inputElement.setInputFiles( tmpFileName );

		return fileName;
	}
}
