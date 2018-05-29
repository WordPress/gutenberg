/**
 * Browser dependencies
 */
const { fetch } = window;
const { createObjectURL, revokeObjectURL } = window.URL;

const cache = {};

export function createBlobURL( blob ) {
	const url = createObjectURL( blob );

	cache[ url ] = blob;

	return url;
}

export function getBlobByURL( url ) {
	if ( cache[ url ] ) {
		return Promise.resolve( cache[ url ] );
	}

	return fetch( url ).then( ( response ) => response.blob() );
}

export function revokeBlobURL( url ) {
	if ( cache[ url ] ) {
		revokeObjectURL( url );
	}

	delete cache[ url ];
}
