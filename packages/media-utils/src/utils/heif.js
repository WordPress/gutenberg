/**
 * External dependencies
 */
const libheif = require( 'libheif-js/wasm-bundle' );

export async function maybeTranscodeHeifImage( file ) {
	const buffer = await file.arrayBuffer();
	if ( ! isHeifImage( buffer ) ) {
		return file;
	}

	const decoder = new libheif.HeifDecoder();

	const imagesArr = decoder.decode( new Uint8Array( buffer ) );

	if ( ! imagesArr.length ) {
		throw new TypeError( 'Not a valid HEIF image' );
	}

	// Image can have multiple frames, thus it's an array.
	// For now, only decode the first frame.
	const image = imagesArr[ 0 ];
	const outBuffer = await decodeImage( image );
	const { width, height } = getDimensions( image );

	return blobToFile(
		await bufferToBlob( outBuffer, width, height ),
		file.name.replace( /\.heic$/, '.jpeg' ),
		'image/jpeg'
	);
}

function getDimensions( image ) {
	const width = image.get_width();
	const height = image.get_height();

	return { width, height };
}

async function decodeImage( image ) {
	const dimensions = getDimensions( image );
	const { width, height } = dimensions;

	return new Promise( ( resolve, reject ) => {
		image.display(
			{
				data: new Uint8ClampedArray( width * height * 4 ),
				width,
				height,
				colorSpace: 'srgb',
			},
			( result ) => {
				if ( ! result ) {
					reject( new Error( 'HEIF processing error' ) );
				} else {
					resolve( result.data.buffer );
				}
			}
		);
	} );
}

function isHeifImage( buffer ) {
	const fourCC = String.fromCharCode(
		...Array.from( new Uint8Array( buffer.slice( 8, 12 ) ) )
	);

	const validFourCC = [
		'mif1', // .heic / image/heif
		'msf1', // .heic / image/heif-sequence
		'heic', // .heic / image/heic
		'heix', // .heic / image/heic
		'hevc', // .heic / image/heic-sequence
		'hevx', // .heic / image/heic-sequence
	];

	return validFourCC.includes( fourCC );
}

function bufferToBlob(
	buffer,
	width,
	height,
	type = 'image/jpeg',
	quality = 0.82
) {
	const canvas = new OffscreenCanvas( width, height );

	const ctx = canvas.getContext( '2d' );

	if ( ! ctx ) {
		throw new Error( 'Could not get context' );
	}

	const imageData = new ImageData(
		new Uint8ClampedArray( buffer ),
		width,
		height
	);

	ctx.putImageData( imageData, 0, 0 );

	return canvas.convertToBlob( { type, quality } );
}

function blobToFile( blob, filename, type ) {
	return new File( [ blob ], filename, { type } );
}
