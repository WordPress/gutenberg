/**
 * Browser dependencies
 */
const { fetch, File } = window;
const { createObjectURL, revokeObjectURL } = window.URL;

const cache = {};

export function createBlobURL( blob ) {
	const { name, lastModified, type } = blob;
	const url = createObjectURL( blob );

	cache[ url ] = {
		blob,
		name,
		lastModified,
		type,
	};

	return url;
}

export function getBlobByURL( url ) {
	if ( cache[ url ] ) {
		const { blob, name, lastModified, type } = cache[ url ];
		const file = new File( [ blob ], name, { lastModified, type } );
		return Promise.resolve( file );
	}

	return fetch( url ).then( ( response ) => response.blob() );
}

export function revokeBlobURL( url ) {
	if ( cache[ url ] ) {
		revokeObjectURL( url );
	}

	delete cache[ url ];
}
