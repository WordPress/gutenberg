import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { randomUUID } from 'crypto';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import type { Page } from '@playwright/test';
import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import type {
	Editor,
	RequestUtils,
} from '@wordpress/e2e-test-utils-playwright';

const ASSETS_DIR = path.join( __dirname, '..', '..', '..', 'assets' );

/**
 * Animated GIF fixture: 12 frames at 599x441, larger than the `medium` size
 * and croppable to `thumbnail`.
 */
const ANIMATED_GIF_FIXTURE = '599x441_e2e_test_image_animated.gif';

/**
 * Resolves `wasm-vips` through `@wordpress/vips`, which declares it, so the
 * import works whether or not it is hoisted.
 */
const wasmVipsEntry = pathToFileURL(
	createRequire( require.resolve( '@wordpress/vips/package.json' ) ).resolve(
		'wasm-vips'
	)
).href;

/**
 * Re-encodes every frame of the GIF fixture as an animated WebP, so the WebP
 * tests need no fixture of their own.
 *
 * @param gif GIF file contents.
 * @return Animated WebP file contents.
 */
async function convertGifToAnimatedWebp( gif: Buffer ): Promise< Buffer > {
	const { default: Vips } = await import( wasmVipsEntry );
	const vips = await Vips( {} );
	const image = vips.Image.newFromBuffer( gif, '[n=-1]' );
	return Buffer.from( image.writeToBuffer( '.webp', { Q: 60 } ) );
}

/**
 * Animated formats libvips can decode and encode with every frame.
 */
const ANIMATED_FORMATS = [
	{
		format: 'GIF',
		mimeType: 'image/gif',
		extension: '.gif',
		createFile: async ( gif: Buffer ) => gif,
	},
	{
		format: 'WebP',
		mimeType: 'image/webp',
		extension: '.webp',
		createFile: convertGifToAnimatedWebp,
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
	const { mimeType, extension, createFile } = animatedFormat;

	await editor.insertBlock( { name: 'core/image' } );

	const imageBlock = editor.canvas.getByRole( 'document', {
		name: 'Block: Image',
	} );
	await expect( imageBlock ).toBeVisible();

	// A unique file name keeps uploads from different tests apart.
	const tmpDirectory = await fs.mkdtemp(
		path.join( os.tmpdir(), 'gutenberg-test-animated-' )
	);
	const tmpFileName = path.join( tmpDirectory, randomUUID() + extension );
	await fs.writeFile(
		tmpFileName,
		await createFile(
			await fs.readFile( path.join( ASSETS_DIR, ANIMATED_GIF_FIXTURE ) )
		)
	);
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
					sizes?.medium?.source_url?.endsWith( extension ),
					sizes?.thumbnail?.source_url?.endsWith( extension ),
				];
			},
			{ timeout: 30_000 }
		)
		.toEqual( [ true, true ] );

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
