/**
 * A step before `core/upload` that works out the dominant color of an image
 * in the browser and sends it along with the upload.
 *
 * This is the smallest useful consumer of the upload operation API: a plan
 * that places the step, a handler that reads the file and returns
 * `additionalData`, and nothing else. Whatever reaches `additionalData` is
 * sent to the server as a field of the upload request, which the plugin's
 * PHP side accepts as `dominant_color` on the media endpoint.
 */
( function () {
	const { registerUploadOperation } = wp.uploadMedia;
	const { __ } = wp.i18n;

	/**
	 * Longest side the image is scaled down to before its pixels are read.
	 *
	 * Enough to keep the dominant color honest for a photo, small enough to
	 * keep the step cheap; an image smaller than this is read at its own
	 * size so nothing is blended.
	 */
	const SAMPLE_SIZE = 64;

	/**
	 * Width of the range of channel values that count as one color.
	 *
	 * Neighboring shades share a bin, so JPEG noise around one color still
	 * counts as that color; the bin reports the mean of what fell into it.
	 */
	const BIN_WIDTH = 8;

	function toHex( channel ) {
		return Math.round( channel ).toString( 16 ).padStart( 2, '0' );
	}

	/**
	 * Works out the color most of the visible image is made of.
	 *
	 * Pixels count in proportion to their opacity, so the transparent parts
	 * of a PNG do not vote, and a translucent edge counts less than the
	 * solid color it borders.
	 *
	 * @param {File} file Image file.
	 * @return {Promise<string|undefined>} Lowercase hex color, or undefined
	 *                                     when the browser cannot decode
	 *                                     the file.
	 */
	async function getDominantColor( file ) {
		let bitmap;
		try {
			bitmap = await createImageBitmap( file );
		} catch {
			return undefined;
		}

		try {
			const scale = Math.min(
				1,
				SAMPLE_SIZE / Math.max( bitmap.width, bitmap.height )
			);
			const width = Math.max( 1, Math.round( bitmap.width * scale ) );
			const height = Math.max( 1, Math.round( bitmap.height * scale ) );
			const canvas = new OffscreenCanvas( width, height );
			const context = canvas.getContext( '2d', {
				willReadFrequently: true,
			} );
			context.drawImage( bitmap, 0, 0, width, height );
			const { data } = context.getImageData( 0, 0, width, height );

			const bins = new Map();
			for ( let i = 0; i < data.length; i += 4 ) {
				const weight = data[ i + 3 ] / 255;
				if ( weight === 0 ) {
					continue;
				}
				const key = [ data[ i ], data[ i + 1 ], data[ i + 2 ] ]
					.map( ( channel ) => Math.floor( channel / BIN_WIDTH ) )
					.join( ',' );
				let bin = bins.get( key );
				if ( ! bin ) {
					bin = { weight: 0, r: 0, g: 0, b: 0 };
					bins.set( key, bin );
				}
				bin.weight += weight;
				bin.r += data[ i ] * weight;
				bin.g += data[ i + 1 ] * weight;
				bin.b += data[ i + 2 ] * weight;
			}

			let dominant;
			for ( const bin of bins.values() ) {
				if ( ! dominant || bin.weight > dominant.weight ) {
					dominant = bin;
				}
			}
			if ( ! dominant ) {
				return undefined;
			}

			return (
				'#' +
				toHex( dominant.r / dominant.weight ) +
				toHex( dominant.g / dominant.weight ) +
				toHex( dominant.b / dominant.weight )
			);
		} finally {
			bitmap.close();
		}
	}

	registerUploadOperation( 'gutenberg-test/dominant-color', {
		label: __( 'Finding dominant color' ),

		plan( item ) {
			if ( ! item.file.type.startsWith( 'image/' ) ) {
				return;
			}
			return { before: 'core/upload' };
		},

		async handler( item ) {
			const color = await getDominantColor( item.file );
			if ( ! color ) {
				return;
			}
			return { additionalData: { dominant_color: color } };
		},
	} );
} )();
