import {
	Uint8ArrayReader,
	Uint8ArrayWriter,
	ZipReader,
} from '@zip.js/zip.js/lib/zip-no-worker-inflate.js';

const AUDIO_FILE_EXTENSION =
	/\.(aac|aif|aiff|flac|m4a|m4b|mp3|oga|ogg|opus|wav|weba)$/i;
const IMAGE_FILE_EXTENSION = /\.(jpe?g|png|gif|webp)$/i;
const COVER_FILE_NAME = /^(cover|folder|album|albumart|artwork)\./i;
const ZIP_LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const ZIP_LOCAL_FILE_HEADER_LENGTH = 30;
const ZIP_COMPRESSION_METHOD_STORE = 0;

export function isZipFile( file ) {
	const mimeTypes = [ file?.mime_type, file?.mime, file?.type ].filter(
		Boolean
	);
	const hasZipFileExtension = ( value ) =>
		typeof value === 'string' && /\.zip(?:[?#].*)?$/i.test( value );

	return (
		hasZipFileExtension( file?.name ) ||
		hasZipFileExtension( file?.filename ) ||
		hasZipFileExtension( file?.file ) ||
		hasZipFileExtension( file?.url ) ||
		hasZipFileExtension( file?.source_url ) ||
		file?.subtype === 'zip' ||
		mimeTypes.some(
			( mimeType ) =>
				mimeType === 'application/zip' ||
				mimeType === 'application/x-zip' ||
				mimeType === 'application/x-zip-compressed'
		)
	);
}

function getFileName( path = '' ) {
	return path.split( /[/\\]/ ).pop() || path;
}

function stripFileExtension( fileName ) {
	return fileName.replace( /\.[^.]+$/, '' );
}

function getTrackDetails( fileName ) {
	const name = stripFileExtension( fileName );
	const matchedDetails = name.match(
		/^(?<artist>.+?)\s+-\s+(?<album>.+?)\s+-\s+(?<trackNumber>\d+)\s+(?<title>.+)$/
	);

	if ( matchedDetails?.groups ) {
		return {
			artist: matchedDetails.groups.artist,
			album: matchedDetails.groups.album,
			title: matchedDetails.groups.title,
			trackNumber: Number( matchedDetails.groups.trackNumber ),
		};
	}

	const numberedTitle = name.match(
		/^(?<trackNumber>\d+)[\s._-]+(?<title>.+)$/
	);

	return {
		title: numberedTitle?.groups?.title || name,
		trackNumber: numberedTitle?.groups
			? Number( numberedTitle.groups.trackNumber )
			: undefined,
	};
}

function sortTracksByNumber( tracks ) {
	return [ ...tracks ].sort( ( a, b ) => {
		const aNumber = a.details.trackNumber;
		const bNumber = b.details.trackNumber;

		if ( aNumber === undefined && bNumber === undefined ) {
			return 0;
		}
		if ( aNumber === undefined ) {
			return 1;
		}
		if ( bNumber === undefined ) {
			return -1;
		}

		return aNumber - bNumber;
	} );
}

function getStoredZipEntryData( entry, zipData ) {
	if (
		entry?.encrypted ||
		entry?.compressionMethod !== ZIP_COMPRESSION_METHOD_STORE
	) {
		return undefined;
	}

	const headerOffset = entry.offset;
	const dataSize = entry.uncompressedSize;

	if (
		! Number.isSafeInteger( headerOffset ) ||
		headerOffset < 0 ||
		! Number.isSafeInteger( dataSize ) ||
		dataSize < 0 ||
		entry.compressedSize !== dataSize ||
		headerOffset + ZIP_LOCAL_FILE_HEADER_LENGTH > zipData.byteLength
	) {
		return undefined;
	}

	const headerView = new DataView(
		zipData.buffer,
		zipData.byteOffset + headerOffset,
		ZIP_LOCAL_FILE_HEADER_LENGTH
	);

	if ( headerView.getUint32( 0, true ) !== ZIP_LOCAL_FILE_HEADER_SIGNATURE ) {
		return undefined;
	}

	const fileNameLength = headerView.getUint16( 26, true );
	const extraFieldLength = headerView.getUint16( 28, true );
	const dataOffset =
		headerOffset +
		ZIP_LOCAL_FILE_HEADER_LENGTH +
		fileNameLength +
		extraFieldLength;
	const dataEnd = dataOffset + dataSize;

	if ( dataEnd > zipData.byteLength ) {
		return undefined;
	}

	return zipData.slice( dataOffset, dataEnd );
}

async function getEntryFile( entry, zipData ) {
	const fileName = getFileName( entry.filename );
	// Keep the MIME type unset so WordPress validates the upload by extension
	// instead of by a browser-dependent guess for extracted ZIP entries.
	let data = getStoredZipEntryData( entry, zipData );
	if ( data === undefined ) {
		data = await entry.getData( new Uint8ArrayWriter() );
	}
	const options = {};

	if ( entry.lastModDate ) {
		options.lastModified = entry.lastModDate.getTime();
	}

	return new File( [ data ], fileName, options );
}

async function getZipReader( zipFile ) {
	const zipData = new Uint8Array( await zipFile.arrayBuffer() );

	return {
		zipData,
		zipReader: new ZipReader( new Uint8ArrayReader( zipData ) ),
	};
}

/**
 * Extract playlist media files and inferred track details from a ZIP archive.
 *
 * @param {File} zipFile ZIP archive selected by the user.
 * @return {Promise<Object>} Extracted audio files, cover image, and track details.
 */
export async function getPlaylistMediaFromZip( zipFile ) {
	const { zipData, zipReader } = await getZipReader( zipFile );

	try {
		const entries = await zipReader.getEntries();
		const tracks = [];
		let imageFile;

		for ( const entry of entries ) {
			if ( entry.directory ) {
				continue;
			}

			const fileName = getFileName( entry.filename );
			const isAudio = AUDIO_FILE_EXTENSION.test( fileName );
			const isCoverImage =
				! imageFile &&
				IMAGE_FILE_EXTENSION.test( fileName ) &&
				COVER_FILE_NAME.test( fileName );

			if ( isAudio ) {
				tracks.push( {
					file: await getEntryFile( entry, zipData ),
					details: getTrackDetails( fileName ),
				} );
				continue;
			}

			if ( isCoverImage ) {
				imageFile = await getEntryFile( entry, zipData );
			}
		}

		return {
			tracks: sortTracksByNumber( tracks ),
			imageFile,
		};
	} finally {
		await zipReader.close();
	}
}
