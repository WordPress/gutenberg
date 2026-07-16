/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs/promises' );
const os = require( 'os' );
const { randomUUID } = require( 'crypto' );

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * @typedef {import('@playwright/test').Page} Page
 */

const ASSETS_DIR = path.join( __dirname, '..', '..', '..', 'assets' );

/**
 * Animated GIF fixture used for conversion tests.
 *
 * Deliberately uses odd width AND height (599x441): the avc/vp9 encoders
 * reject odd dimensions, so this fixture regression-guards the even-dimension
 * padding. Its size also makes the ImageDecoder track-ready race
 * (`completed` resolving before `tracks.ready`) reproducible, which an
 * even, tiny fixture did not catch.
 */
const ANIMATED_GIF_FIXTURE = '599x441_e2e_test_image_animated.gif';

test.use( {
	gifToVideoUtils: async ( { page, editor }, use ) => {
		await use( new GifToVideoUtils( { page, editor } ) );
	},
} );

/**
 * Shared utilities for the GIF-to-video e2e tests.
 */
class GifToVideoUtils {
	constructor( { page, editor } ) {
		/** @type {Page} */
		this.page = page;
		this.editor = editor;
	}

	/**
	 * Upload a file to the given input element.
	 * Copies the asset to a unique temp file to avoid cross-test collisions.
	 *
	 * @param {import('@playwright/test').Locator} inputElement File input locator.
	 * @param {string}                             fileName     File name in the assets directory.
	 * @return {Promise<string>} Unique file name (without extension).
	 */
	async upload( inputElement, fileName ) {
		const tmpDirectory = await fs.mkdtemp(
			path.join( os.tmpdir(), 'gutenberg-test-gif-' )
		);
		const uniqueName = randomUUID();
		const extension = path.extname( fileName );
		const tmpFileName = path.join( tmpDirectory, uniqueName + extension );
		await fs.copyFile( path.join( ASSETS_DIR, fileName ), tmpFileName );
		await inputElement.setInputFiles( tmpFileName );
		return uniqueName;
	}

	/**
	 * Inserts an Image block and uploads the animated GIF fixture into it.
	 * Waits for the editor to finish setting up first: an insert dispatched
	 * during setup is wiped by the editor's initial blocks reset.
	 */
	async uploadAnimatedGif() {
		await expect(
			this.editor.canvas.getByRole( 'button', {
				name: 'Add default block',
			} )
		).toBeVisible();

		await this.editor.insertBlock( { name: 'core/image' } );

		const imageBlock = this.editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageBlock ).toBeVisible();

		await this.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' ),
			ANIMATED_GIF_FIXTURE
		);
	}

	/**
	 * The conversion prompt dialog.
	 *
	 * @return {import('@playwright/test').Locator} Dialog locator.
	 */
	getPromptDialog() {
		return this.page.getByRole( 'dialog', {
			name: 'Convert to video',
		} );
	}

	/**
	 * Wait for the upload-media store queue to drain.
	 *
	 * @param {number} timeout Timeout in milliseconds.
	 */
	async waitForUploadQueueEmpty( timeout = 120000 ) {
		await this.page.waitForFunction(
			() => {
				const items = window.wp.data
					.select( 'core/upload-media' )
					.getItems();
				return items.length === 0;
			},
			undefined,
			{ timeout }
		);
	}

	/**
	 * Returns the current blocks as name/attributes pairs.
	 */
	async getBlocks() {
		return this.page.evaluate( () =>
			window.wp.data
				.select( 'core/block-editor' )
				.getBlocks()
				.map( ( block ) => ( {
					name: block.name,
					attributes: block.attributes,
				} ) )
		);
	}

	/**
	 * Waits until a block of the given name exists in the editor.
	 *
	 * @param {string} blockName Block name, e.g. 'core/video'.
	 * @param {number} timeout   Timeout in milliseconds.
	 */
	async waitForBlock( blockName, timeout = 90000 ) {
		await this.page.waitForFunction(
			( name ) =>
				window.wp.data
					.select( 'core/block-editor' )
					.getBlocks()
					.some( ( block ) => block.name === name ),
			blockName,
			{ timeout }
		);
	}

	/**
	 * Wait for the editor's core-data copy of the attachment record to carry
	 * the sideloaded companion video. The block transform to the Video block
	 * matches synchronously against this record, so the "Video" entry only
	 * appears in the block switcher once it has resolved.
	 *
	 * @param {number} attachmentId Attachment ID.
	 * @param {number} timeout      Timeout in milliseconds.
	 */
	async waitForCompanionRecord( attachmentId, timeout = 30000 ) {
		await this.page.waitForFunction(
			( id ) =>
				!! window.wp.data
					.select( 'core' )
					.getEntityRecord( 'postType', 'attachment', id, {
						context: 'view',
					} )?.media_details?.animated_video,
			attachmentId,
			{ timeout }
		);
	}

	/**
	 * Skip this test if the GIF-to-video path is not active.
	 *
	 * The conversion requires:
	 *   - client-side media processing enabled globally,
	 *   - ImageDecoder (for GIF frame extraction), and
	 *   - VideoEncoder (WebCodecs encode).
	 *
	 * @param {import('@playwright/test').TestInfo} testInstance The test object.
	 */
	async skipIfGifConversionInactive( testInstance ) {
		// This guard is intentionally conservative: it skips the test when any
		// required capability is absent. The crossOriginIsolated check is not a
		// runtime capability differentiator - client-side media already requires
		// Document Isolation Policy globally - but it confirms the test
		// environment is set up correctly before asserting conversion results.
		const isActive = await this.page.evaluate( () => {
			if ( ! window.__clientSideMediaProcessing ) {
				return false;
			}
			return (
				typeof ImageDecoder !== 'undefined' &&
				typeof VideoEncoder !== 'undefined' &&
				window.crossOriginIsolated === true
			);
		} );
		testInstance.skip(
			! isActive,
			'GIF-to-video conversion is not active in this environment (requires WebCodecs + cross-origin isolation)'
		);
	}
}

test.describe( 'Video conversion: animated GIF to video', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.beforeEach( async ( { admin, gifToVideoUtils } ) => {
		await admin.createNewPost();
		await gifToVideoUtils.skipIfGifConversionInactive( test );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'prompts on upload and converts to a video on request, with undo as the way back', async ( {
		editor,
		page,
		pageUtils,
		gifToVideoUtils,
		requestUtils,
	} ) => {
		await gifToVideoUtils.uploadAnimatedGif();

		// The upload is not blocked by the prompt: the GIF uploads as a
		// plain image attachment while the dialog is open, and no companion
		// video exists yet.
		const dialog = gifToVideoUtils.getPromptDialog();
		await expect( dialog ).toBeVisible( { timeout: 60_000 } );

		// While the prompt is open it is the single point of attention: the
		// upload progress snackbar is suppressed.
		await expect(
			page.locator( '.components-snackbar', { hasText: /Uploading/ } )
		).toBeHidden();

		await gifToVideoUtils.waitForUploadQueueEmpty( 60_000 );

		// Also suppressed once the upload finishes behind the open prompt.
		await expect(
			page.locator( '.components-snackbar', {
				hasText: 'Upload complete',
			} )
		).toBeHidden();

		const blocksAfterUpload = await gifToVideoUtils.getBlocks();
		expect(
			blocksAfterUpload.some( ( block ) => block.name === 'core/video' )
		).toBe( false );

		const uploadedImage = blocksAfterUpload.find(
			( block ) => block.name === 'core/image'
		);
		expect( uploadedImage.attributes.url ).toMatch( /\.gif(\?.*)?$/i );
		const attachmentId = uploadedImage.attributes.id;
		expect( attachmentId ).toBeDefined();

		let media = await requestUtils.rest( {
			method: 'GET',
			path: `/wp/v2/media/${ attachmentId }`,
		} );
		expect( media.mime_type ).toBe( 'image/gif' );
		expect( media.media_details?.animated_video ).toBeUndefined();

		// Converting is the steered default: the primary button holds focus,
		// so Enter converts.
		const convertButton = dialog.getByRole( 'button', {
			name: 'Convert',
			exact: true,
		} );
		await expect( convertButton ).toBeFocused();
		await convertButton.click();
		await expect( dialog ).toBeHidden();

		// The companion video is transcoded and sideloaded, and the block is
		// swapped to the Video block's GIF variation.
		await gifToVideoUtils.waitForBlock( 'core/video' );

		const videoBlock = ( await gifToVideoUtils.getBlocks() ).find(
			( block ) => block.name === 'core/video'
		);
		expect( videoBlock.attributes.controls ).toBe( false );
		expect( videoBlock.attributes.loop ).toBe( true );
		expect( videoBlock.attributes.autoplay ).toBe( true );
		expect( videoBlock.attributes.muted ).toBe( true );
		expect( videoBlock.attributes.playsInline ).toBe( true );
		expect( videoBlock.attributes.src ).toMatch( /\.(mp4|webm)(\?.*)?$/i );
		expect( videoBlock.attributes.id ).toBe( attachmentId );

		media = await requestUtils.rest( {
			method: 'GET',
			path: `/wp/v2/media/${ attachmentId }`,
		} );
		expect( media.media_details.animated_video ).toMatch(
			/\.(mp4|webm)$/i
		);

		// The converted block carries the GIF's intrinsic dimensions so the
		// <video> has a stable aspect ratio from the first paint.
		expect( videoBlock.attributes.width ).toBe( media.media_details.width );
		expect( videoBlock.attributes.height ).toBe(
			media.media_details.height
		);

		const renderedVideo = editor.canvas.locator(
			'figure.wp-block-video video'
		);
		await expect( renderedVideo ).toHaveAttribute(
			'width',
			String( videoBlock.attributes.width )
		);
		await expect( renderedVideo ).toHaveAttribute(
			'height',
			String( videoBlock.attributes.height )
		);
		await expect( renderedVideo ).toHaveCSS(
			'aspect-ratio',
			`${ videoBlock.attributes.width } / ${ videoBlock.attributes.height }`
		);

		// There is deliberately no transform back to an Image block; undo is
		// the way back. A single undo reverts the swap and restores the
		// Image block showing the original GIF.
		await pageUtils.pressKeys( 'primary+z' );

		await gifToVideoUtils.waitForBlock( 'core/image', 10_000 );
		expect(
			( await gifToVideoUtils.getBlocks() ).every(
				( block ) => block.name !== 'core/video'
			)
		).toBe( true );

		const restoredImage = ( await gifToVideoUtils.getBlocks() ).find(
			( block ) => block.name === 'core/image'
		);
		expect( restoredImage.attributes.id ).toBe( attachmentId );
		expect( restoredImage.attributes.url ).toMatch( /\.gif(\?.*)?$/i );

		// And since the companion video is kept on the attachment, the block
		// switcher still offers converting again.
		await editor.canvas
			.locator( 'role=document[name="Block: Image"i]' )
			.click();
		await gifToVideoUtils.waitForCompanionRecord( attachmentId );
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Image', exact: true } )
			.click();
		await expect(
			page
				.getByRole( 'menu', { name: 'Image' } )
				.getByRole( 'menuitem', { name: 'Video', exact: true } )
		).toBeVisible();
	} );

	test( 'keeps the GIF and skips the transcode when declined', async ( {
		gifToVideoUtils,
		requestUtils,
	} ) => {
		await gifToVideoUtils.uploadAnimatedGif();

		const dialog = gifToVideoUtils.getPromptDialog();
		await expect( dialog ).toBeVisible( { timeout: 60_000 } );
		await dialog.getByRole( 'button', { name: 'Not now' } ).click();
		await expect( dialog ).toBeHidden();

		await gifToVideoUtils.waitForUploadQueueEmpty( 60_000 );

		// The block stays an Image block pointing at the GIF, and no
		// companion video was transcoded: declining skips the conversion
		// work entirely rather than hiding its result.
		const blocks = await gifToVideoUtils.getBlocks();
		expect( blocks.some( ( block ) => block.name === 'core/video' ) ).toBe(
			false
		);
		const image = blocks.find( ( block ) => block.name === 'core/image' );
		expect( image.attributes.url ).toMatch( /\.gif(\?.*)?$/i );

		const media = await requestUtils.rest( {
			method: 'GET',
			path: `/wp/v2/media/${ image.attributes.id }`,
		} );
		expect( media.mime_type ).toBe( 'image/gif' );
		expect( media.media_details?.animated_video ).toBeUndefined();
	} );
} );
