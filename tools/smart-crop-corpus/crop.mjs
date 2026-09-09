/**
 * Cropping for the smart crop review harness.
 *
 * This deliberately mirrors the production path rather than reimplementing it.
 * For a standard 8-bit image, `applyResizeAndCrop()` in `packages/vips` ends up
 * calling exactly one libvips operation per size:
 *
 *     vips.Image.thumbnailBuffer( buffer, width, {
 *         size: 'down',
 *         height,
 *         crop: smartCrop ? 'attention' : 'centre',
 *     } )
 *
 * so that is what this file calls, against the same pinned `wasm-vips` the
 * browser bundle uses. The only difference is the Node entry point of the
 * module instead of the browser one; the libvips build underneath is identical.
 *
 * @see packages/vips/src/index.ts
 */

// wasm-vips is a dependency of packages/vips rather than of the root package.
// Resolving it from the workspace is the point: this harness has to crop with
// the same pinned build the browser bundle ships.
// eslint-disable-next-line import/no-extraneous-dependencies
import Vips from 'wasm-vips';

/**
 * Boots libvips.
 *
 * @return {Promise<any>} The libvips module.
 */
export async function createVips() {
	const vips = await Vips( {
		// The optional HEIF/JXL/resvg libraries are not needed here and cost
		// several megabytes to load.
		dynamicLibraries: [],
		print: () => {},
		printErr: () => {},
	} );

	// Every image in a run is different, so the operation cache never gets a
	// hit; all it does is hold references until the wasm heap runs out.
	vips.Cache.max( 0 );

	return vips;
}

/**
 * Normalises an image to 3-band sRGB so two crops can be compared numerically.
 *
 * Takes ownership of `image` and frees it. Every libvips operation allocates a
 * new object in a wasm heap that is not garbage collected, so anything not
 * explicitly deleted accumulates until a run dies part way through.
 *
 * @param {any} image A libvips image; consumed by this call.
 * @return {any} A new image; the caller owns it.
 */
function toComparable( image ) {
	const srgb = image.colourspace( 'srgb' );
	image.delete();

	if ( ! srgb.hasAlpha() ) {
		return srgb;
	}

	const flattened = srgb.flatten( { background: [ 255, 255, 255 ] } );
	srgb.delete();
	return flattened;
}

/**
 * Mean absolute difference between two same-sized images, as a 0..1 fraction.
 *
 * Used as a stand-in for "did smart crop actually change anything" and for the
 * attention/entropy agreement signal floated in the issue. It is computed on
 * the decoded pixels, before encoding, so it is not measuring JPEG noise.
 *
 * @param {any} a First image.
 * @param {any} b Second image.
 * @return {number} 0 when identical, 1 at maximum difference.
 */
function meanAbsoluteDifference( a, b ) {
	if ( a.width !== b.width || a.height !== b.height ) {
		return 1;
	}

	const delta = a.subtract( b );
	const difference = delta.abs();
	delta.delete();

	const mean = difference.avg();
	difference.delete();

	return mean / 255;
}

/**
 * Largest rectangle of a given aspect ratio that fits inside the source.
 *
 * `smartcrop()` refuses targets larger than the input, and the focal point is a
 * property of the aspect ratio rather than of the output pixel size, so the
 * probe runs at whatever size actually fits.
 *
 * @param {number} sourceWidth  Source width.
 * @param {number} sourceHeight Source height.
 * @param {number} aspect       Target aspect ratio (width / height).
 * @return {{width: number, height: number}} The fitted rectangle.
 */
function fitAspect( sourceWidth, sourceHeight, aspect ) {
	// A target wider than the source is limited by the source width, and a
	// taller one by the source height.
	const [ width, height ] =
		aspect >= sourceWidth / sourceHeight
			? [ sourceWidth, sourceWidth / aspect ]
			: [ sourceHeight * aspect, sourceHeight ];

	return {
		width: Math.max( 1, Math.min( sourceWidth, Math.floor( width ) ) ),
		height: Math.max( 1, Math.min( sourceHeight, Math.floor( height ) ) ),
	};
}

/**
 * Asks libvips where the attention of an image lies, for a given aspect ratio.
 *
 * libvips does not return a confidence score, which the issue calls out as the
 * crux of the proposal. It does return the attention centre, so the harness
 * records that and derives the candidate signals from it.
 *
 * @param {any}    vips   The libvips module.
 * @param {any}    source Decoded source image.
 * @param {number} aspect Target aspect ratio (width / height).
 * @return {{x: number, y: number}|null} Normalised focal point, or null.
 */
function findFocalPoint( vips, source, aspect ) {
	const target = fitAspect( source.width, source.height, aspect );

	try {
		const options = {
			interesting: 'attention',
			attention_x: 0,
			attention_y: 0,
		};
		// libvips writes the attention centre back onto the options object.
		source.smartcrop( target.width, target.height, options ).delete();

		return {
			x: Number( ( options.attention_x / source.width ).toFixed( 4 ) ),
			y: Number( ( options.attention_y / source.height ).toFixed( 4 ) ),
		};
	} catch {
		return null;
	}
}

/**
 * How unevenly detail is spread across an image.
 *
 * An image with a subject has somewhere busy and somewhere plain: a statue
 * against a wall, a bird against sky. An image without one is evenly detailed
 * all over, and a stack of firewood or a hedge will happily report a strong
 * off-centre focal point without containing anything a crop could miss.
 *
 * Measured as the coefficient of variation of edge energy across an 8x8 grid,
 * which is scale-free, so a bright image and a dark one are comparable. Uniform
 * texture lands near 0.1; a subject on a plain ground lands near 0.3.
 *
 * @param {any} image Decoded source image.
 * @return {number} 0 for perfectly even detail, higher for a distinct subject.
 */
function detailSpread( image ) {
	const grid = 8;
	// Shrink first: the measure wants the shape of the composition, not every
	// leaf, and it makes the operation cheap enough to run on a whole pool.
	const small = image.resize( 256 / image.width );
	const grey = small.colourspace( 'b-w' );
	small.delete();
	const edges = grey.sobel();
	grey.delete();
	const blocks = edges.resize( grid / edges.width, {
		vscale: grid / edges.height,
	} );
	edges.delete();

	const cells = [];
	for ( let y = 0; y < grid; y++ ) {
		for ( let x = 0; x < grid; x++ ) {
			cells.push( blocks.getpoint( x, y )[ 0 ] );
		}
	}
	blocks.delete();

	const mean =
		cells.reduce( ( sum, value ) => sum + value, 0 ) / cells.length;
	if ( ! mean ) {
		return 0;
	}

	const variance =
		cells.reduce( ( sum, value ) => sum + ( value - mean ) ** 2, 0 ) /
		cells.length;

	return Math.sqrt( variance ) / mean;
}

/**
 * Asks whether an image has something worth finding away from its centre.
 *
 * This is the selection test, and it is deliberately not attention's opinion
 * alone. `attention` reports a focal point, and it is the only strategy that
 * does, so how far that point sits from the middle is one half. The other half
 * is `entropy`, which scores information content rather than saliency and knows
 * nothing about faces or skin: if it also declines to crop from the centre,
 * then two unrelated measures agree the middle is the wrong place.
 *
 * Both of those say where the interesting part is, and neither says whether
 * there is one, so `detailSpread` is the third number: an evenly detailed image
 * has no subject to miss however confidently attention points at a corner of
 * it.
 *
 * An image that scores well on all three is one where a centre crop is likely
 * to cut something out, which is the case smart crop exists for.
 *
 * @param {Object} options
 * @param {any}    options.vips   The libvips module.
 * @param {any}    options.source Decoded source image.
 * @param {any}    options.buffer Original encoded bytes.
 * @param {Object} options.size   `{ name, width, height }`.
 * @return {Object|null} `{ focalOffset, entropyShift, detailSpread }`, or null
 *                       when the source is too small for the size.
 */
export function probeSubject( { vips, source, buffer, size } ) {
	if ( source.width < size.width || source.height < size.height ) {
		return null;
	}

	const focalPoint = findFocalPoint( vips, source, size.width / size.height );

	const thumbnail = ( crop ) =>
		toComparable(
			vips.Image.thumbnailBuffer( buffer, size.width, {
				size: 'down',
				height: size.height,
				crop,
			} )
		);

	const centre = thumbnail( 'centre' );
	const entropy = thumbnail( 'entropy' );

	try {
		return {
			// How far attention puts the subject from the middle.
			focalOffset: focalPoint
				? Number(
						Math.hypot(
							focalPoint.x - 0.5,
							focalPoint.y - 0.5
						).toFixed( 4 )
				  )
				: 0,
			// How much a strategy that has never heard of saliency still moves
			// the frame away from the centre.
			entropyShift: Number(
				meanAbsoluteDifference( entropy, centre ).toFixed( 4 )
			),
			// Whether there is a subject at all, as opposed to where it is.
			detailSpread: Number( detailSpread( source ).toFixed( 4 ) ),
		};
	} finally {
		centre.delete();
		entropy.delete();
	}
}

/**
 * Produces the centre and attention crops of one image at one target size.
 *
 * @param {Object} options
 * @param {any}    options.vips    The libvips module.
 * @param {any}    options.source  Decoded source image, for the focal point probe.
 * @param {any}    options.buffer  Original encoded bytes.
 * @param {Object} options.size    `{ name, width, height }`.
 * @param {number} options.quality JPEG quality for the review renditions.
 * @return {Object|null} Crop results, or null when the source is too small.
 */
export function cropPair( { vips, source, buffer, size, quality = 82 } ) {
	// `size: 'down'` never upscales, so a source smaller than the target would
	// silently produce something other than the requested crop.
	if ( source.width < size.width || source.height < size.height ) {
		return null;
	}

	const thumbnail = ( crop ) =>
		toComparable(
			vips.Image.thumbnailBuffer( buffer, size.width, {
				size: 'down',
				height: size.height,
				crop,
			} )
		);

	const centre = thumbnail( 'centre' );
	const attention = thumbnail( 'attention' );
	const entropy = thumbnail( 'entropy' );

	// How much of the source survives the crop. This is fixed by the two aspect
	// ratios rather than by the strategy, and it is what decides whether the
	// two strategies have room to disagree: a crop that keeps 90% of the frame
	// is barely a choice.
	const kept = fitAspect(
		source.width,
		source.height,
		size.width / size.height
	);
	const coverage =
		( kept.width * kept.height ) / ( source.width * source.height );

	try {
		const changeFromCentre = meanAbsoluteDifference( attention, centre );
		const entropyDifference = meanAbsoluteDifference( attention, entropy );
		const focalPoint = findFocalPoint(
			vips,
			source,
			size.width / size.height
		);

		return {
			size: size.name,
			width: size.width,
			height: size.height,
			sourceWidth: source.width,
			sourceHeight: source.height,
			coverage: Number( coverage.toFixed( 3 ) ),
			renditions: {
				centre: Buffer.from(
					centre.writeToBuffer( '.jpg', { Q: quality } )
				),
				attention: Buffer.from(
					attention.writeToBuffer( '.jpg', { Q: quality } )
				),
			},
			signals: {
				focalPoint,
				// Candidate 1 from the issue: how far the attention centre sits
				// from the image centre. 0 means attention agreed with centre.
				centreOffset: focalPoint
					? Number(
							Math.hypot(
								focalPoint.x - 0.5,
								focalPoint.y - 0.5
							).toFixed( 4 )
					  )
					: null,
				// Candidate 2: agreement between the attention and entropy
				// strategies, measured on their outputs rather than their rects,
				// because libvips does not expose the rect.
				entropyAgreement: Number(
					( 1 - entropyDifference ).toFixed( 4 )
				),
				// How much smart crop changed the picture at all. Near zero means
				// attention landed on the centre and there is nothing to grade.
				changeFromCentre: Number( changeFromCentre.toFixed( 4 ) ),
			},
			// Below roughly half a grey level of average difference the two
			// crops are the same picture, and asking a reviewer to compare them
			// wastes their attention.
			unchanged: changeFromCentre < 0.002,
		};
	} finally {
		centre.delete();
		attention.delete();
		entropy.delete();
	}
}

/**
 * Spread of the focal point across the target aspect ratios.
 *
 * Candidate 3 from the issue: if attention picks a wildly different subject
 * depending on the requested shape, that instability is itself a signal that
 * the result should not be trusted.
 *
 * @param {Array} results Per-size results for one image.
 * @return {number|null} Spread, or null when no focal point was found.
 */
export function aspectStability( results ) {
	const points = results
		.map( ( result ) => result.signals?.focalPoint )
		.filter( Boolean );

	if ( points.length < 2 ) {
		return null;
	}

	const meanX =
		points.reduce( ( sum, point ) => sum + point.x, 0 ) / points.length;
	const meanY =
		points.reduce( ( sum, point ) => sum + point.y, 0 ) / points.length;
	const spread = Math.max(
		...points.map( ( point ) =>
			Math.hypot( point.x - meanX, point.y - meanY )
		)
	);

	return Number( spread.toFixed( 4 ) );
}
