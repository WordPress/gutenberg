import {
	BlobReader,
	BlobWriter,
	ZipReader,
} from '@zip.js/zip.js/lib/zip-no-worker-inflate.js';

const AUDIO_FILE_EXTENSION =
	/\.(aac|aif|aiff|flac|m4a|m4b|mp3|oga|ogg|opus|wav|weba)$/i;
const IMAGE_FILE_EXTENSION = /\.(jpe?g|png|gif|webp)$/i;
const COVER_FILE_NAME = /^(cover|folder|album|albumart|artwork)\./i;

const MIME_TYPES = {
	aac: 'audio/aac',
	aif: 'audio/aiff',
	aiff: 'audio/aiff',
	flac: 'audio/flac',
	gif: 'image/gif',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	m4a: 'audio/mp4',
	m4b: 'audio/mp4',
	mp3: 'audio/mpeg',
	oga: 'audio/ogg',
	ogg: 'audio/ogg',
	opus: 'audio/ogg',
	png: 'image/png',
	wav: 'audio/wav',
	weba: 'audio/webm',
	webp: 'image/webp',
};

export function isZipFile( file ) {
	return (
		!! file?.name?.match( /\.zip$/i ) ||
		file?.type === 'application/zip' ||
		file?.type === 'application/x-zip-compressed'
	);
}

function getFileName( path = '' ) {
	return path.split( /[/\\]/ ).pop() || path;
}

function getFileExtension( fileName ) {
	return fileName.split( '.' ).pop()?.toLowerCase();
}

function getMimeType( fileName ) {
	return MIME_TYPES[ getFileExtension( fileName ) ] || '';
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
	const type = getMimeType( fileName );
	const blob = await entry.getData( new BlobWriter( type ) );
	const options = { type: blob.type || type };

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

	try {
		const entries = await zipReader.getEntries();
		const tracks = [];
		let imageFile;

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
		await zipReader.close();
	}
}
