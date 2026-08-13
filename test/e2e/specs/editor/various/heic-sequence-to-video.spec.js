const path = require( 'path' );
const fs = require( 'fs/promises' );
const os = require( 'os' );
const { randomUUID } = require( 'crypto' );
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * @typedef {import('@playwright/test').Page} Page
 */

const ASSETS_DIR = path.join( __dirname, '..', '..', '..', 'assets' );

/**
 * A real HEIF image sequence: 256x144, 25fps, 120 HEVC frames.
 *
 * Note the `.heic` extension. Exported Live Photos routinely look like
 * ordinary stills by name and MIME type, so this fixture also guards the
 * container sniffing that has to see past that.
 */
const IMAGE_SEQUENCE_FIXTURE = '256x144_e2e_test_image_sequence.heic';

/** An ordinary photo, for the tests that only need a companion recorded. */
const STILL_IMAGE_FIXTURE = '1024x768_e2e_test_image_size.jpeg';

/**
 * Asserts a block carries the Live photo playback signature: muted, looping
 * and inline, with neither controls nor autoplay, so it rests on its poster.
 *
 * @param {Object} attributes Video block attributes.
 */
function expectLivePhotoPlayback( attributes ) {
	expect( attributes ).toMatchObject( {
		controls: false,
		loop: true,
		muted: true,
		playsInline: true,
	} );
	expect( attributes.autoplay ).toBeFalsy();
}

test.use( {
	sequenceUtils: async ( { page }, use ) => {
		await use( new ImageSequenceUtils( { page } ) );
	},
} );

/**
 * Shared utilities for the image-sequence e2e tests.
 */
class ImageSequenceUtils {
	constructor( { page } ) {
		/** @type {Page} */
		this.page = page;
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
			path.join( os.tmpdir(), 'gutenberg-test-sequence-' )
		);
		const uniqueName = randomUUID();
		const extension = path.extname( fileName );
		const tmpFileName = path.join( tmpDirectory, uniqueName + extension );
		await fs.copyFile( path.join( ASSETS_DIR, fileName ), tmpFileName );
		await inputElement.setInputFiles( tmpFileName );
		return uniqueName;
	}

	/**
	 * Wait for the upload-media store queue to drain.
	 *
	 * @param {number} timeout Timeout in milliseconds.
	 */
	async waitForUploadQueueEmpty( timeout = 120000 ) {
		await this.page.waitForFunction(
			() =>
				window.wp.data.select( 'core/upload-media' ).getItems()
					.length === 0,
			undefined,
			{ timeout }
		);
	}

	/**
	 * Returns the blocks currently in the canvas.
	 *
	 * @return {Promise<Array<{name: string, attributes: Object}>>} Blocks.
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
	 * Wait until the canvas holds exactly the given block names.
	 *
	 * Asserts against the editor store rather than the DOM: the converted
	 * block's <video> points at a companion file that the test fixtures never
	 * actually create, so waiting for it to paint would be waiting for
	 * something that cannot happen.
	 *
	 * @param {string[]} names   Expected block names, in order.
	 * @param {number}   timeout Timeout in milliseconds.
	 */
	async waitForBlockNames( names, timeout = 30000 ) {
		await this.page.waitForFunction(
			( expected ) => {
				const actual = window.wp.data
					.select( 'core/block-editor' )
					.getBlocks()
					.map( ( block ) => block.name );
				return (
					actual.length === expected.length &&
					actual.every( ( name, i ) => name === expected[ i ] )
				);
			},
			names,
			{ timeout }
		);
	}

	/**
	 * Skip this test unless the browser can decode HEVC image sequences.
	 *
	 * The conversion needs client-side media processing plus a platform HEVC
	 * decoder, which CI's Linux Chromium does not have. Tests that only need
	 * the editor behavior use the companion test plugin instead of this guard.
	 *
	 * @param {import('@playwright/test').TestInfo} testInstance The test object.
	 */
	async skipIfSequenceConversionInactive( testInstance ) {
		const isActive = await this.page.evaluate( async () => {
			if (
				! window.__clientSideMediaProcessing ||
				typeof VideoDecoder === 'undefined' ||
				typeof VideoEncoder === 'undefined' ||
				window.crossOriginIsolated !== true
			) {
				return false;
			}
			try {
				const { supported } = await VideoDecoder.isConfigSupported( {
					codec: 'hvc1.1.6.L93.B0',
					codedWidth: 256,
					codedHeight: 144,
				} );
				return !! supported;
			} catch {
				return false;
			}
		} );
		testInstance.skip(
			! isActive,
			'HEVC sequence conversion is not active in this environment (requires a platform HEVC decoder + cross-origin isolation)'
		);
	}
}

test.describe( 'Video conversion: HEIC/HEIF image sequence', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.describe( 'conversion', () => {
		test.beforeEach( async ( { admin, sequenceUtils } ) => {
			await admin.createNewPost();
			await sequenceUtils.skipIfSequenceConversionInactive( test );
		} );

		test( 'uploads a still image and plays its motion as a Live photo', async ( {
			editor,
			sequenceUtils,
			requestUtils,
		} ) => {
			// Wait for the editor to finish setting up the (empty) post before
			// inserting: an insert dispatched during setup is wiped by the
			// editor's initial blocks reset.
			await expect(
				editor.canvas.getByRole( 'document', {
					name: 'Add default block',
				} )
			).toBeVisible();

			await editor.insertBlock( { name: 'core/image' } );

			const imageBlock = editor.canvas.locator(
				'role=document[name="Block: Image"i]'
			);
			await expect( imageBlock ).toBeVisible();

			await sequenceUtils.upload(
				imageBlock.locator( 'data-testid=form-file-upload-input' ),
				IMAGE_SEQUENCE_FIXTURE
			);

			// Drains the still upload, the source_original sideload, and the
			// companion video transcode.
			await sequenceUtils.waitForUploadQueueEmpty( 120_000 );

			// The block becomes a Live photo video once the companion lands.
			await sequenceUtils.waitForBlockNames( [ 'core/video' ] );

			const blocks = await sequenceUtils.getBlocks();
			expect( blocks[ 0 ].name ).toBe( 'core/video' );
			expectLivePhotoPlayback( blocks[ 0 ].attributes );
			expect( blocks[ 0 ].attributes.src ).toMatch( /\.(mp4|webm)$/i );

			// The attachment itself is the still image, with the motion stored
			// beside it and the user's original file preserved.
			const media = await requestUtils.rest( {
				method: 'GET',
				path: `/wp/v2/media/${ blocks[ 0 ].attributes.id }`,
			} );
			expect( media.mime_type ).toBe( 'image/jpeg' );
			expect( media.media_details.animated_video ).toMatch(
				/\.(mp4|webm)$/i
			);
			// The user's own .heic is kept beside the still it was decoded
			// from, under the key the still-HEIC flow already uses.
			expect( media.media_details.source_image ).toMatch( /\.heic$/i );

			// The still is the poster, so the video rests on the frame the
			// media library shows.
			expect( blocks[ 0 ].attributes.poster ).toBe( media.source_url );
		} );
	} );

	test.describe( 'editor behavior', () => {
		// Recording a companion on an ordinary upload reproduces the state the
		// conversion leaves behind, so these run everywhere, including on CI
		// where no HEVC decoder exists.
		test.beforeEach( async ( { admin, requestUtils } ) => {
			await requestUtils.activatePlugin(
				'gutenberg-test-live-photo-companion'
			);
			await admin.createNewPost();
		} );

		test.afterEach( async ( { requestUtils } ) => {
			await requestUtils.deactivatePlugin(
				'gutenberg-test-live-photo-companion'
			);
		} );

		/**
		 * Uploads the still fixture into an Image block and waits for the
		 * automatic conversion to a Live photo.
		 *
		 * @param {Object} fixtures               Playwright fixtures.
		 * @param {Object} fixtures.editor        Editor utils.
		 * @param {Object} fixtures.sequenceUtils Sequence utils.
		 */
		async function uploadAndConvert( { editor, sequenceUtils } ) {
			await expect(
				editor.canvas.getByRole( 'document', {
					name: 'Add default block',
				} )
			).toBeVisible();

			await editor.insertBlock( { name: 'core/image' } );

			const imageBlock = editor.canvas.locator(
				'role=document[name="Block: Image"i]'
			);
			await expect( imageBlock ).toBeVisible();

			await sequenceUtils.upload(
				imageBlock.locator( 'data-testid=form-file-upload-input' ),
				STILL_IMAGE_FIXTURE
			);
			await sequenceUtils.waitForUploadQueueEmpty( 60_000 );

			await sequenceUtils.waitForBlockNames( [ 'core/video' ] );
		}

		test( 'converts to a Live photo once the companion is recorded', async ( {
			editor,
			sequenceUtils,
		} ) => {
			await uploadAndConvert( { editor, sequenceUtils } );

			const blocks = await sequenceUtils.getBlocks();
			expect( blocks[ 0 ].name ).toBe( 'core/video' );
			expectLivePhotoPlayback( blocks[ 0 ].attributes );
		} );

		test( 'plays on hover on the front end, and only there', async ( {
			editor,
			page,
			sequenceUtils,
		} ) => {
			await uploadAndConvert( { editor, sequenceUtils } );

			const postId = await editor.publishPost();
			await page.goto( `/?p=${ postId }` );

			// The behavior is wired up at render time, so the saved markup
			// carries the directives without a block deprecation.
			const video = page.locator( 'figure.wp-block-video video' );
			await expect( video ).toHaveAttribute(
				'data-wp-interactive',
				'core/video'
			);
			await expect( video ).toHaveAttribute(
				'data-wp-on--pointerenter',
				'actions.playLivePhoto'
			);
			// Reachable without a pointer.
			await expect( video ).toHaveAttribute( 'tabindex', '0' );
			// It rests on the still: autoplay would make it an animation.
			await expect( video ).not.toHaveAttribute( 'autoplay', /.*/ );
			await expect( video ).toHaveAttribute( 'poster', /.+/ );
		} );

		test( 'leaves an ordinary video page without the extra script', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/video',
				attributes: {
					src: 'https://example.com/video.mp4',
					controls: true,
				},
			} );

			const postId = await editor.publishPost();
			await page.goto( `/?p=${ postId }` );

			await expect(
				page.locator( 'figure.wp-block-video video' )
			).not.toHaveAttribute( 'data-wp-interactive', /.*/ );
			expect( await page.content() ).not.toContain(
				'block-library/video/view'
			);
		} );

		test( 'undo restores the still image and leaves it alone', async ( {
			editor,
			pageUtils,
			sequenceUtils,
		} ) => {
			await uploadAndConvert( { editor, sequenceUtils } );

			await pageUtils.pressKeys( 'primary+z' );

			await sequenceUtils.waitForBlockNames( [ 'core/image' ] );

			/*
			 * The companion is still recorded, so without a guard the effect
			 * would convert again and the author could never get back to the
			 * still. Interacting with the restored block gives it every chance
			 * to do so before the assertion.
			 */
			await editor.canvas
				.locator( 'role=document[name="Block: Image"i]' )
				.click();

			const blocks = await sequenceUtils.getBlocks();
			expect( blocks[ 0 ].name ).toBe( 'core/image' );
		} );

		test( 'turns back into an Image block from the toolbar', async ( {
			editor,
			page,
			sequenceUtils,
		} ) => {
			await uploadAndConvert( { editor, sequenceUtils } );

			await page
				.getByRole( 'button', { name: 'Display as still image' } )
				.click();

			await sequenceUtils.waitForBlockNames( [ 'core/image' ] );

			const blocks = await sequenceUtils.getBlocks();
			expect( blocks[ 0 ].name ).toBe( 'core/image' );
			// The flag is what keeps it from converting straight back.
			expect( blocks[ 0 ].attributes.preserveStillImage ).toBe( true );
		} );

		test( 'leaves gallery images alone, since a gallery only holds images', async ( {
			editor,
			sequenceUtils,
		} ) => {
			await expect(
				editor.canvas.getByRole( 'document', {
					name: 'Add default block',
				} )
			).toBeVisible();

			await editor.insertBlock( { name: 'core/gallery' } );

			const galleryBlock = editor.canvas.locator(
				'role=document[name="Block: Gallery"i]'
			);
			await expect( galleryBlock ).toBeVisible();

			await sequenceUtils.upload(
				galleryBlock.locator( 'data-testid=form-file-upload-input' ),
				STILL_IMAGE_FIXTURE
			);
			await sequenceUtils.waitForUploadQueueEmpty( 60_000 );

			// The uploaded image is what the effect would act on, so select it
			// before asserting that nothing converted.
			await editor.canvas
				.locator( 'role=document[name="Block: Image"i]' )
				.first()
				.click();

			const blocks = await sequenceUtils.getBlocks();
			expect( blocks[ 0 ].name ).toBe( 'core/gallery' );
			expect( await editor.getEditedPostContent() ).not.toContain(
				'wp:video'
			);
		} );
	} );
} );
