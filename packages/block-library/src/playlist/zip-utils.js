import {
	BlobReader,
	BlobWriter,
	ZipReader,
} from '@zip.js/zip.js/lib/zip-no-worker-inflate.js';

const AUDIO_FILE_EXTENSION =
	/\.(aac|aif|aiff|flac|m4a|m4b|mp3|oga|ogg|opus|wav|weba)$/i;
const IMAGE_FILE_EXTENSION = /\.(jpe?g|png|gif|webp)$/i;
const COVER_FILE_NAME = /^(cover|folder|album|albumart|artwork)\./i;
const DEBUG_STORAGE_KEY = 'wpPlaylistZipDebug';

function getSafeUrlDetails( url ) {
	if ( typeof url !== 'string' ) {
		return undefined;
	}

	try {
		const parsedUrl = new URL( url, 'https://example.invalid' );
		return {
			pathname: parsedUrl.pathname,
			hasSearch: parsedUrl.search !== '',
			hasHash: parsedUrl.hash !== '',
		};
	} catch {
		return { value: url.replace( /[?#].*$/, '' ) };
	}
}

function isPlaylistZipDebugEnabled() {
	if ( typeof window === 'undefined' ) {
		return false;
	}

	if ( window.__wpPlaylistZipDebug === true ) {
		return true;
	}

	try {
		return window.localStorage?.getItem( DEBUG_STORAGE_KEY ) === '1';
	} catch {
		return false;
	}
}

export function getPlaylistZipDebugMediaInfo( media ) {
	const mediaUrl = media?.url ?? media?.source_url;

	return {
		name: media?.name,
		filename: media?.filename,
		file: typeof media?.file === 'string' ? media.file : undefined,
		type: media?.type,
		mime: media?.mime,
		mimeType: media?.mime_type,
		subtype: media?.subtype,
		size: media?.size,
		hasUrl: !! mediaUrl,
		url: getSafeUrlDetails( mediaUrl ),
	};
}

export function debugPlaylistZip( message, details ) {
	if ( ! isPlaylistZipDebugEnabled() ) {
		return;
	}

	// eslint-disable-next-line no-console
	console.debug( '[Playlist ZIP]', message, details );
}

export function isZipFile( file ) {
	const mimeTypes = [ file?.mime_type, file?.mime, file?.type ].filter(
		Boolean
	);
	const hasZipFileExtension = ( value ) =>
		typeof value === 'string' && /\.zip(?:[?#].*)?$/i.test( value );

	const isZip =
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
		);

	debugPlaylistZip( 'checked ZIP file candidate', {
		media: getPlaylistZipDebugMediaInfo( file ),
		mimeTypes,
		isZip,
	} );

	return isZip;
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

async function getEntryFile( entry ) {
	const fileName = getFileName( entry.filename );
	// Keep the MIME type unset so WordPress validates the upload by extension
	// instead of by a browser-dependent guess for extracted ZIP entries.
	const blob = await entry.getData( new BlobWriter() );
	const options = {};

	if ( entry.lastModDate ) {
		options.lastModified = entry.lastModDate.getTime();
	}

	return new File( [ blob ], fileName, options );
}

/**
 * Extract playlist media files and inferred track details from a ZIP archive.
 *
 * @param {File} zipFile ZIP archive selected by the user.
 * @return {Promise<Object>} Extracted audio files, cover image, and track details.
 */
export async function getPlaylistMediaFromZip( zipFile ) {
	const zipReader = new ZipReader( new BlobReader( zipFile ) );
	debugPlaylistZip(
		'opening ZIP file',
		getPlaylistZipDebugMediaInfo( zipFile )
	);

	try {
		const entries = await zipReader.getEntries();
		const tracks = [];
		let imageFile;
		debugPlaylistZip( 'read ZIP entries', {
			count: entries.length,
			entries: entries.map( ( entry ) => ( {
				filename: entry.filename,
				directory: entry.directory,
			} ) ),
		} );

		for ( const entry of entries ) {
			if ( entry.directory ) {
				continue;
			}

			const fileName = getFileName( entry.filename );
			if ( AUDIO_FILE_EXTENSION.test( fileName ) ) {
				tracks.push( {
					file: await getEntryFile( entry ),
					details: getTrackDetails( fileName ),
				} );
				continue;
			}

			if (
				! imageFile &&
				IMAGE_FILE_EXTENSION.test( fileName ) &&
				COVER_FILE_NAME.test( fileName )
			) {
				imageFile = await getEntryFile( entry );
			}
		}

		return {
			tracks: sortTracksByNumber( tracks ),
			imageFile,
		};
	} finally {
		debugPlaylistZip( 'closing ZIP file' );
		await zipReader.close();
	}
}
