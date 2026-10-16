import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { randomUUID } from 'crypto';
import type { Page } from '@playwright/test';
import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import type {
	Editor,
	RequestUtils,
} from '@wordpress/e2e-test-utils-playwright';

const ASSETS_DIR = path.join( __dirname, '..', '..', '..', 'assets' );

/**
 * Animated formats libvips can decode and encode with every frame. Both
 * fixtures are the same 12-frame 599x441 animation, larger than the `medium`
 * size and croppable to `thumbnail`.
 */
const ANIMATED_FORMATS = [
	{
		format: 'GIF',
		fileName: '599x441_e2e_test_image_animated.gif',
		mimeType: 'image/gif',
		extension: /\.gif$/i,
	},
	{
		format: 'WebP',
		fileName: '599x441_e2e_test_image_animated.webp',
		mimeType: 'image/webp',
		extension: /\.webp$/i,
	},
];

type AnimatedFormat = ( typeof ANIMATED_FORMATS )[ number ];

type FrameInfo = {
	frameCount: number;
	lastFrameWidth: number;
	lastFrameHeight: number;
};

type SubSizeFrames = {
	full: FrameInfo;
	medium: FrameInfo;
	thumbnail: FrameInfo;
};

/**
 * Skips the test unless uploads go through client-side media processing and
 * the browser can count frames with `ImageDecoder`.
 *
 * @param page Playwright page.
 */
async function skipIfUnsupported( page: Page ) {
	const isActive = await page.evaluate( () => {
		const win = window as any;
		return (
			!! win.__clientSideMediaProcessing &&
			!! win.wp?.uploadMedia?.isClientSideMediaSupported?.() &&
			typeof win.ImageDecoder !== 'undefined'
		);
	} );
	test.skip(
		! isActive,
		'Client-side media processing or ImageDecoder is not available'
	);
}

/**
 * Uploads an animated image to a new Image block and reads the frames of the
 * full size and of its `medium` and `thumbnail` sub-sizes.
 *
 * @param fixtures              Test fixtures.
 * @param fixtures.page         Playwright page.
 * @param fixtures.editor       Editor fixture.
 * @param fixtures.requestUtils Request utils fixture.
 * @param animatedFormat        Fixture to upload.
 * @return Frame count and last frame dimensions of each size.
 */
async function uploadAndReadSubSizeFrames(
	{
		page,
		editor,
		requestUtils,
	}: { page: Page; editor: Editor; requestUtils: RequestUtils },
	animatedFormat: AnimatedFormat
): Promise< SubSizeFrames > {
	const { fileName, mimeType, extension } = animatedFormat;

	await editor.insertBlock( { name: 'core/image' } );

	const imageBlock = editor.canvas.getByRole( 'document', {
		name: 'Block: Image',
	} );
	await expect( imageBlock ).toBeVisible();

	// A unique file name keeps uploads from different tests apart.
	const tmpDirectory = await fs.mkdtemp(
		path.join( os.tmpdir(), 'gutenberg-test-animated-' )
	);
	const tmpFileName = path.join(
		tmpDirectory,
		randomUUID() + path.extname( fileName )
	);
	await fs.copyFile( path.join( ASSETS_DIR, fileName ), tmpFileName );
	await imageBlock
		.getByTestId( 'form-file-upload-input' )
		.setInputFiles( tmpFileName );

	await page.waitForFunction(
		() =>
			( window as any ).wp.data.select( 'core/upload-media' ).getItems()
				.length === 0,
		undefined,
		{ timeout: 60_000 }
	);

	const attachmentId = await page.evaluate(
		() =>
			( window as any ).wp.data
				.select( 'core/block-editor' )
				.getBlocks()
				.find( ( block: any ) => block.name === 'core/image' )
				?.attributes.id
	);
	expect( attachmentId ).toBeDefined();

	// The sub-sizes are recorded in the attachment metadata shortly after
	// the queue drains.
	let media: any;
	await expect
		.poll(
			async () => {
				media = await requestUtils.rest( {
					method: 'GET',
					path: `/wp/v2/media/${ attachmentId }`,
				} );
				const sizes = media.media_details?.sizes;
				return [
					sizes?.medium?.source_url,
					sizes?.thumbnail?.source_url,
				];
			},
			{ timeout: 30_000 }
		)
		.toEqual( [
			expect.stringMatching( extension ),
			expect.stringMatching( extension ),
		] );

	return page.evaluate(
		async ( { urls, type } ) => {
			const readFrames = async ( url: string ) => {
				const data = await ( await fetch( url ) ).arrayBuffer();
				const decoder = new ( window as any ).ImageDecoder( {
					data,
					type,
				} );
				try {
					await decoder.tracks.ready;
					const frameCount =
						decoder.tracks.selectedTrack?.frameCount ?? 0;
					const { image } = await decoder.decode( {
						frameIndex: frameCount - 1,
					} );
					const info = {
						frameCount,
						lastFrameWidth: image.displayWidth,
						lastFrameHeight: image.displayHeight,
					};
					image.close();
					return info;
				} finally {
					decoder.close();
				}
			};
			return {
				full: await readFrames( urls.full ),
				medium: await readFrames( urls.medium ),
				thumbnail: await readFrames( urls.thumbnail ),
			};
		},
		{
			urls: {
				full: media.source_url,
				medium: media.media_details.sizes.medium.source_url,
				thumbnail: media.media_details.sizes.thumbnail.source_url,
			},
			type: mimeType,
		}
	);
}

test.describe( 'Animated image sub-sizes', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.beforeEach( async ( { admin, page } ) => {
		await admin.createNewPost();
		await skipIfUnsupported( page );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	for ( const animatedFormat of ANIMATED_FORMATS ) {
		test( `keeps the animation in every sub-size of an animated ${ animatedFormat.format }`, async ( {
			page,
			editor,
			requestUtils,
		} ) => {
			const frames = await uploadAndReadSubSizeFrames(
				{ page, editor, requestUtils },
				animatedFormat
			);

			// Not an exact match against the source: encoders may coalesce
			// near-identical frames. Keeping the animation is what matters.
			expect( frames.full.frameCount ).toBeGreaterThan( 1 );
			expect( frames.medium.frameCount ).toBeGreaterThan( 1 );
			expect( frames.thumbnail.frameCount ).toBeGreaterThan( 1 );

			// Every frame of the cropped size is cut to the same rectangle,
			// so the last one is a full 150x150 thumbnail too.
			expect( frames.thumbnail ).toMatchObject( {
				lastFrameWidth: 150,
				lastFrameHeight: 150,
			} );
		} );
	}

	test.describe( 'with the wp_generate_animated_image_subsizes filter returning false', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activatePlugin(
				'gutenberg-test-animated-image-subsizes'
			);
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deactivatePlugin(
				'gutenberg-test-animated-image-subsizes'
			);
		} );

		for ( const animatedFormat of ANIMATED_FORMATS ) {
			test( `generates static first-frame sub-sizes of an animated ${ animatedFormat.format }, matching core`, async ( {
				page,
				editor,
				requestUtils,
			} ) => {
				const frames = await uploadAndReadSubSizeFrames(
					{ page, editor, requestUtils },
					animatedFormat
				);

				expect( frames.full.frameCount ).toBeGreaterThan( 1 );
				expect( frames.medium.frameCount ).toBe( 1 );
				expect( frames.thumbnail ).toMatchObject( {
					frameCount: 1,
					lastFrameWidth: 150,
					lastFrameHeight: 150,
				} );
			} );
		}
	} );
} );
