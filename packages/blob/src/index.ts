const cache: Record< string, File > = {};

/**
 * Create a blob URL from a file.
 *
 * @param file The file to create a blob URL for.
 *
 * @return The blob URL.
 */
export function createBlobURL( file: File ): string {
	const url = window.URL.createObjectURL( file );

	cache[ url ] = file;

	return url;
}

/**
 * Retrieve a file based on a blob URL. The file must have been created by
 * `createBlobURL` and not removed by `revokeBlobURL`, otherwise it will return
 * `undefined`.
 *
 * @param url The blob URL.
 *
 * @return The file for the blob URL.
 */
export function getBlobByURL( url: string ): File | undefined {
	return cache[ url ];
}

/**
 * Retrieve a blob type based on URL. The file must have been created by
 * `createBlobURL` and not removed by `revokeBlobURL`, otherwise it will return
 * `undefined`.
 *
 * @param url The blob URL.
 *
 * @return The blob type.
 */
export function getBlobTypeByURL( url: string ): string | undefined {
	return getBlobByURL( url )?.type.split( '/' )[ 0 ]; // 0: media type , 1: file extension eg ( type: 'image/jpeg' ).
}

/**
 * Remove the resource and file cache from memory.
 *
 * @param url The blob URL.
 */
export function revokeBlobURL( url: string ): void {
	if ( cache[ url ] ) {
		window.URL.revokeObjectURL( url );
	}

	delete cache[ url ];
}

/**
 * Check whether a url is a blob url.
 *
 * @param url The URL.
 *
 * @return Is the url a blob url?
 */
export function isBlobURL( url: string | undefined ): boolean {
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
 *
 * ```js
 * 	const fileContent = JSON.stringify(
 * 		{
 * 			"title": "My Post",
 * 		},
 * 		null,
 * 		2
 * 	);
 * 	const filename = 'file.json';
 *
 * 	downloadBlob( filename, fileContent, 'application/json' );
 * ```
 *
 * @param filename    File name.
 * @param content     File content (BufferSource | Blob | string).
 * @param contentType (Optional) File mime type. Default is `''`.
 */
export function downloadBlob(
	filename: string,
	content: BlobPart,
	contentType: string = ''
): void {
	if ( ! filename || ! content ) {
		return;
	}

	const file = new window.Blob( [ content ], { type: contentType } );
	const url = window.URL.createObjectURL( file );
	const anchorElement = document.createElement( 'a' );
	anchorElement.href = url;
	anchorElement.download = filename;
	anchorElement.style.display = 'none';
	document.body.appendChild( anchorElement );
	anchorElement.click();
	document.body.removeChild( anchorElement );
	window.URL.revokeObjectURL( url );
}
