/**
 * Replaces `core/transcode-image` with a step that encodes the image in
 * several formats using the browser's own encoders and uploads whichever
 * came out smallest, the original included.
 *
 * This is the escape hatch of the upload operation API exercised end to
 * end: unregister a core step, register a plugin's own under the same
 * name, and have it run where core's did. The replacement runs with a
 * plugin's context, not core's, so everything it does goes through the
 * public contract: the item snapshot in, a `file` out.
 *
 * Core only plans `core/transcode-image` for an original when the server
 * asks for a format conversion, so the replacement also plans itself in
 * for every image, before the upload, when nothing has placed it yet.
 */
( function () {
	const { registerUploadOperation, unregisterUploadOperation } =
		wp.uploadMedia;
	const { __ } = wp.i18n;

	const OPERATION = 'core/transcode-image';

	/**
	 * Quality every lossy candidate is encoded at, so they compete on size
	 * alone.
	 */
	const QUALITY = 0.82;

	const EXTENSIONS = {
		'image/jpeg': 'jpg',
		'image/png': 'png',
		'image/webp': 'webp',
	};

	/**
	 * Formats the step re-encodes.
	 *
	 * A still image only: an animated GIF decodes to its first frame, and
	 * re-encoding that would upload a still where the author dropped an
	 * animation.
	 */
	const SOURCE_TYPES = [
		'image/jpeg',
		'image/png',
		'image/webp',
		'image/avif',
	];

	/**
	 * Whether any pixel of the image is less than fully opaque.
	 *
	 * Sampled at a reduced size: the answer is the same and the scan is a
	 * fraction of the cost.
	 *
	 * @param {ImageBitmap} bitmap Decoded image.
	 * @return {boolean} True when the image has transparency.
	 */
	function hasTransparency( bitmap ) {
		const size = 64;
		const canvas = new OffscreenCanvas( size, size );
		const context = canvas.getContext( '2d', { willReadFrequently: true } );
		context.drawImage( bitmap, 0, 0, size, size );
		const { data } = context.getImageData( 0, 0, size, size );
		for ( let i = 3; i < data.length; i += 4 ) {
			if ( data[ i ] < 255 ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Encodes the image in every format that would not lose anything it
	 * has, and returns the smallest result along with what was compared.
	 *
	 * @param {File} file Image file.
	 * @return {Promise<{ file: File, record: Object }|undefined>} The
	 *         smallest file and the record, or undefined when the browser
	 *         cannot decode the image.
	 */
	async function pickSmallestEncoding( file ) {
		let bitmap;
		try {
			bitmap = await createImageBitmap( file );
		} catch {
			return undefined;
		}

		try {
			const canvas = new OffscreenCanvas( bitmap.width, bitmap.height );
			canvas.getContext( '2d' ).drawImage( bitmap, 0, 0 );

			// A JPEG has no alpha channel, so it only competes for an opaque
			// image; PNG is the lossless option and always competes.
			const types = hasTransparency( bitmap )
				? [ 'image/webp', 'image/png' ]
				: [ 'image/webp', 'image/jpeg', 'image/png' ];

			const candidates = { [ file.type ]: file.size };
			let smallest = file;
			for ( const type of types ) {
				const blob = await canvas.convertToBlob( {
					type,
					quality: QUALITY,
				} );
				// A browser that cannot encode a format falls back to PNG;
				// that is a PNG candidate, not one of this type.
				if ( blob.type !== type ) {
					continue;
				}
				candidates[ type ] = Math.min(
					candidates[ type ] ?? Infinity,
					blob.size
				);
				if ( blob.size < smallest.size ) {
					const basename = file.name.replace( /\.[^.]+$/, '' );
					smallest = new File(
						[ blob ],
						`${ basename }.${ EXTENSIONS[ type ] }`,
						{ type, lastModified: file.lastModified }
					);
				}
			}

			return {
				file: smallest,
				record: {
					type: smallest.type,
					size: smallest.size,
					candidates,
				},
			};
		} finally {
			bitmap.close();
		}
	}

	unregisterUploadOperation( OPERATION );
	registerUploadOperation( OPERATION, {
		label: __( 'Picking the smallest encoding' ),

		plan( item, { operations } ) {
			if ( ! SOURCE_TYPES.includes( item.file.type ) ) {
				return;
			}
			const alreadyPlanned = operations.some(
				( operation ) =>
					( Array.isArray( operation )
						? operation[ 0 ]
						: operation ) === OPERATION
			);
			if ( alreadyPlanned ) {
				return;
			}
			return { before: 'core/upload' };
		},

		async handler( item ) {
			const result = await pickSmallestEncoding( item.file );
			if ( ! result ) {
				return;
			}
			return {
				file: result.file,
				additionalData: {
					smallest_encoding: JSON.stringify( result.record ),
				},
			};
		},
	} );
} )();
