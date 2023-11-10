/**
 * @type {Record<string, File|undefined>}
 */
const cache = {};

/**
 * Create a blob URL from a file.
 *
 * @param {File} file The file to create a blob URL for.
 *
 * @return {string} The blob URL.
 */
export function createBlobURL( file ) {
	const url = window.URL.createObjectURL( file );

	cache[ url ] = file;

	return url;
}

/**
 * Retrieve a file based on a blob URL. The file must have been created by
 * `createBlobURL` and not removed by `revokeBlobURL`, otherwise it will return
 * `undefined`.
 *
 * @param {string} url The blob URL.
 *
 * @return {File|undefined} The file for the blob URL.
 */
export function getBlobByURL( url ) {
	return cache[ url ];
}

/**
 * Retrieve a blob type based on URL. The file must have been created by
 * `createBlobURL` and not removed by `revokeBlobURL`, otherwise it will return
 * `undefined`.
 *
 * @param {string} url The blob URL.
 *
 * @return {string|undefined} The blob type.
 */
export function getBlobTypeByURL( url ) {
	return getBlobByURL( url )?.type.split( '/' )[ 0 ]; // 0: media type , 1: file extension eg ( type: 'image/jpeg' ).
}

/**
 * Remove the resource and file cache from memory.
 *
 * @param {string} url The blob URL.
 */
export function revokeBlobURL( url ) {
	if ( cache[ url ] ) {
		window.URL.revokeObjectURL( url );
	}

	delete cache[ url ];
}

/**
 * Check whether a url is a blob url.
 *
 * @param {string|undefined} url The URL.
 *
 * @return {boolean} Is the url a blob url?
 */
export function isBlobURL( url ) {
	if ( ! url || ! url.indexOf ) {
		return false;
	}
	return url.indexOf( 'blob:' ) === 0;
}

/**
 * Downloads a file, e.g., a text or readable stream, in the browser.
 * Appropriate for downloading smaller file sizes, e.g., < 5 MB.
 *
 * Example usage:
 * 	const fileContent = JSON.stringify(
 * 		{
 * 			"title": "My Post",
 * 		},
 * 		null,
 * 		2
 * 	);
 * 	const fileName = 'file.json';
 *
 * 	downloadBlob( 'file.json', fileContent, 'application/json' );
 *
 * @param {string} fileName    File Name.
 * @param {string} content     File Content.
 * @param {string} contentType File mime type.
 * @return {HTMLElement}       The created anchor element.
 */
export function downloadBlob( fileName = 'wp-download', content, contentType ) {
	const file = new window.Blob( [ content ], { type: contentType } );
	const url = window.URL.createObjectURL( file );
	const a = document.createElement( 'a' );
	a.href = url;
	a.download = fileName;
	a.style.display = 'none';
	document.body.appendChild( a );
	a.click();
	document.body.removeChild( a );
	window.URL.revokeObjectURL( url );
	return a;
}
