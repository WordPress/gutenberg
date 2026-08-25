/**
 * Face detection for image cropping, running in the browser.
 *
 * Loading this module is cheap; calling it is not, because the first call
 * fetches an inference runtime. It is imported dynamically at the point an
 * image is about to be cropped rather than with the editor.
 */

import { toSubjectArea } from './subject';
import {
	loadRuntime,
	normalizeAssetsUrl,
	type RuntimeSession,
} from './runtime';
import {
	INPUT_SIZE,
	decodeDetections,
	getLetterbox,
	imageDataToTensor,
	nonMaximumSuppression,
	toNormalizedDetections,
	type YuNetOutputs,
} from './yunet';
import type { DetectSubjectOptions, SubjectArea } from './types';

/**
 * File name of the detection model, as copied next to the runtime binaries.
 */
const MODEL_FILE = 'face_detection_yunet_2023mar.onnx';

/**
 * Default score a detection has to clear to count.
 *
 * Measured across a portrait set, real faces score 0.82 and above while the
 * near misses - a statue, a face-like pattern in fur - sit below 0.75. 0.7
 * keeps the faces, and is deliberately not tighter because the crop policy
 * already does nothing when a subject is not at risk of being cut.
 */
const DEFAULT_MIN_CONFIDENCE = 0.7;

/**
 * One session per assets URL, since creating it parses the model.
 */
const sessions = new Map< string, Promise< RuntimeSession > >();

/**
 * Loads the detection model, reusing the session on later calls.
 *
 * @param assetsUrl Base URL the model is served from, with a trailing slash.
 * @return The inference session.
 */
function getSession( assetsUrl: string ): Promise< RuntimeSession > {
	let session = sessions.get( assetsUrl );

	if ( ! session ) {
		session = Promise.all( [
			loadRuntime( assetsUrl ),
			fetch( `${ assetsUrl }${ MODEL_FILE }` ).then( ( response ) => {
				if ( ! response.ok ) {
					throw new Error(
						`Could not load the detection model (${ response.status }).`
					);
				}
				return response.arrayBuffer();
			} ),
		] )
			.then( ( [ runtime, model ] ) =>
				runtime.InferenceSession.create( model, {
					executionProviders: [ 'wasm' ],
					graphOptimizationLevel: 'all',
				} )
			)
			.catch( ( error ) => {
				// Do not cache a failure, so a transient one can be retried.
				sessions.delete( assetsUrl );
				throw error;
			} );

		sessions.set( assetsUrl, session );
	}

	return session;
}

/**
 * Makes a square drawing surface, off-screen where that is supported.
 *
 * @param size Side of the square.
 * @return A 2D context to draw into.
 */
function createContext( size: number ) {
	if ( typeof OffscreenCanvas !== 'undefined' ) {
		const offscreen = new OffscreenCanvas( size, size ).getContext( '2d', {
			willReadFrequently: true,
		} );
		if ( offscreen ) {
			return offscreen;
		}
	}

	const canvas = document.createElement( 'canvas' );
	canvas.width = size;
	canvas.height = size;
	const context = canvas.getContext( '2d', { willReadFrequently: true } );

	if ( ! context ) {
		throw new Error( 'Could not get a canvas context for detection.' );
	}

	return context;
}

/**
 * Decodes an image and letterboxes it into the square the model expects.
 *
 * @param source Image data.
 * @param size   Side of the square.
 * @return The square's pixels, and where the image landed inside it.
 */
async function toSquarePixels( source: Blob, size: number ) {
	const bitmap = await createImageBitmap( source, {
		imageOrientation: 'from-image',
	} );

	try {
		const letterbox = getLetterbox( bitmap.width, bitmap.height, size );
		const context = createContext( size );

		context.drawImage(
			bitmap,
			letterbox.left,
			letterbox.top,
			letterbox.width,
			letterbox.height
		);

		return {
			pixels: context.getImageData( 0, 0, size, size ).data,
			letterbox,
		};
	} finally {
		bitmap.close();
	}
}

/**
 * Finds the area of an image a crop should try to keep.
 *
 * Returns null when nothing was found with enough confidence, which is the
 * signal to leave the crop where it would have been.
 *
 * @param source  The image to inspect.
 * @param options Where to load the runtime from, and how sure to insist on being.
 * @return The subject area, or null.
 */
export async function detectSubject(
	source: Blob,
	options: DetectSubjectOptions
): Promise< SubjectArea | null > {
	const { minConfidence = DEFAULT_MIN_CONFIDENCE, signal } = options;
	const assetsUrl = normalizeAssetsUrl( options.assetsUrl );

	signal?.throwIfAborted();

	const [ runtime, session ] = await Promise.all( [
		loadRuntime( assetsUrl ),
		getSession( assetsUrl ),
	] );

	signal?.throwIfAborted();

	const { pixels, letterbox } = await toSquarePixels( source, INPUT_SIZE );

	signal?.throwIfAborted();

	const results = await session.run( {
		input: new runtime.Tensor(
			'float32',
			imageDataToTensor( pixels, INPUT_SIZE ),
			[ 1, 3, INPUT_SIZE, INPUT_SIZE ]
		),
	} );

	const outputs: YuNetOutputs = {};
	for ( const name of session.outputNames ) {
		outputs[ name ] = results[ name ].data;
	}

	const boxes = nonMaximumSuppression(
		decodeDetections( outputs, INPUT_SIZE, minConfidence )
	);

	return toSubjectArea(
		toNormalizedDetections( boxes, letterbox ),
		minConfidence
	);
}
