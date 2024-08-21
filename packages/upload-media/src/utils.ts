/**
 * WordPress dependencies
 */
import { getFilename } from '@wordpress/url';
import { _x } from '@wordpress/i18n';
import { getMimeTypeFromExtension } from '@wordpress/mime';

/**
 * Internal dependencies
 */
import { MediaError } from './mediaError';

/**
 * Renames a given file and returns a new file.
 *
 * Copies over the last modified time.
 *
 * @param file File object.
 * @param name File name.
 * @return Renamed file object.
 */
export function renameFile( file: File, name: string ): File {
	return new File( [ file ], name, {
		type: file.type,
		lastModified: file.lastModified,
	} );
}

/**
 * Clones a given file object.
 *
 * @param file File object.
 * @return New file object.
 */
export function cloneFile( file: File ): File {
	return renameFile( file, file.name );
}

/**
 * Returns the file extension from a given file name or URL.
 *
 * @param file File URL.
 * @return File extension or null if it does not have one.
 */
export function getFileExtension( file: string ): string | null {
	return file.includes( '.' ) ? file.split( '.' ).pop() || null : null;
}

/**
 * Returns file basename without extension.
 *
 * For example, turns "my-awesome-file.jpeg" into "my-awesome-file".
 *
 * @param name File name.
 * @return File basename.
 */
export function getFileBasename( name: string ): string {
	return name.includes( '.' )
		? name.split( '.' ).slice( 0, -1 ).join( '.' )
		: name;
}

/**
 * Returns the file name including extension from a URL.
 *
 * @param url File URL.
 * @return File name.
 */
export function getFileNameFromUrl( url: string ) {
	return getFilename( url ) || _x( 'unnamed', 'file name' );
}

/**
 * Fetches a remote file and returns a File instance.
 *
 * @param url          URL.
 * @param nameOverride File name to use, instead of deriving it from the URL.
 */
export async function fetchFile( url: string, nameOverride?: string ) {
	const response = await fetch( url );
	if ( ! response.ok ) {
		throw new Error( `Could not fetch remote file: ${ response.status }` );
	}

	const name = nameOverride || getFileNameFromUrl( url );
	const blob = await response.blob();

	const ext = getFileExtension( name );
	const guessedMimeType = ext ? getMimeTypeFromExtension( ext ) : '';

	let type = '';

	// blob.type can be an empty string when server does not return a correct Content-Type.
	if ( blob.type && blob.type !== 'application/octet-stream' ) {
		type = blob.type;
	} else if ( guessedMimeType ) {
		type = guessedMimeType;
	}

	const file = new File( [ blob ], name, { type } );

	if ( ! guessedMimeType ) {
		throw new MediaError( {
			code: 'FETCH_REMOTE_FILE_ERROR',
			message: 'File could not be uploaded',
			file,
		} );
	}

	return file;
}

type DevToolsColor =
	| 'primary'
	| 'primary-light'
	| 'primary-dark'
	| 'secondary'
	| 'secondary-light'
	| 'secondary-dark'
	| 'tertiary'
	| 'tertiary-light'
	| 'tertiary-dark'
	| 'error';

export interface MeasureOptions {
	measureName: string;
	startTime: number | string;
	endTime?: number | string;
	/*
	 The color the entry will be displayed with in the timeline. Can only be a value from the
	 palette defined in DevToolsColor
	*/
	color?: DevToolsColor;
	/*
	 The name (and identifier) of the extension track the entry belongs to. Entries intended to
	 be displayed to the same track should contain the same value in this property.
	*/
	track?: string;
	/*
	 The track group an entry’s track belongs to.
	 Entries intended to be displayed in the same track must contain the same value in this property
	 as well as the same value in the `track` property.
	*/
	trackGroup?: string;
	// A short description shown over the entry when hovered.
	tooltipText?: string;
	// key-value pairs added to the details drawer when the entry is selected.
	properties?: [ string, string | number ][];
}

/**
 * Small wrapper around `performance.measure`.
 *
 * Only works if not in production mode.
 *
 * @param $0             Parameters object passed to the function.
 * @param $0.measureName A string representing the name of the measure.
 * @param $0.startTime   Start time.
 * @param $0.endTime     End time. Defaults to `performance.now()`
 * @param $0.tooltipText A short description shown over the entry when hovered.
 * @param $0.properties  key-value pairs added to the details drawer when the entry is selected.
 * @param $0.color       The color the entry will be displayed with in the timeline.
 * @param $0.track       The name (and identifier) of the extension track the entry belongs to.
 */
export function measure( {
	measureName,
	startTime,
	endTime = performance.now(),
	tooltipText,
	properties = [],
	color = 'primary',
	track = 'Media Experiments',
}: MeasureOptions ) {
	// The following code is only relevant for the Gutenberg plugin.
	// It's a stand-alone if statement for dead-code elimination.
	if ( globalThis.IS_GUTENBERG_PLUGIN ) {
		// eslint-disable-next-line @wordpress/wp-global-usage
		if ( globalThis.SCRIPT_DEBUG === true ) {
			performance.measure( measureName, {
				start: startTime,
				end: endTime,
				detail: {
					devtools: {
						// An identifier for the data type contained in the payload
						dataType: 'track-entry',
						color,
						// All entries will be grouped under this track.
						track,
						// A short description shown over the entry when hovered.
						tooltipText,
						// key-value pairs added to the details drawer when the entry is selected.
						properties,
					},
				},
			} );
		}
	}
}
