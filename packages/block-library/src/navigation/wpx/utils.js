// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-undef */

// For wrapperless hydration of document.body.
// See https://gist.github.com/developit/f4c67a2ede71dc2fab7f357f39cff28c
export const createRootFragment = ( parent, replaceNode ) => {
	replaceNode = [].concat( replaceNode );
	const s = replaceNode[ replaceNode.length - 1 ].nextSibling;
	function insert( c, r ) {
		parent.insertBefore( c, r || s );
	}
	return ( parent.__k = {
		nodeType: 1,
		parentNode: parent,
		firstChild: replaceNode[ 0 ],
		childNodes: replaceNode,
		insertBefore: insert,
		appendChild: insert,
		removeChild( c ) {
			parent.removeChild( c );
		},
	} );
};

// Helper function to await until the CPU is idle.
export const idle = () =>
	new Promise( ( resolve ) => window.requestIdleCallback( resolve ) );

export const knownSymbols = new Set(
	Object.getOwnPropertyNames( Symbol )
		.map( ( key ) => Symbol[ key ] )
		.filter( ( value ) => typeof value === 'symbol' )
);
const supported = new Set( [
	Object,
	Array,
	Int8Array,
	Uint8Array,
	Uint8ClampedArray,
	Int16Array,
	Uint16Array,
	Int32Array,
	Uint32Array,
	Float32Array,
	Float64Array,
] );
export const shouldWrap = ( { constructor } ) => {
	const isBuiltIn =
		typeof constructor === 'function' &&
		constructor.name in globalThis &&
		globalThis[ constructor.name ] === constructor;
	return ! isBuiltIn || supported.has( constructor );
};

// Deep Merge
const isObject = ( item ) =>
	item && typeof item === 'object' && ! Array.isArray( item );

export const deepMerge = ( target, source ) => {
	if ( isObject( target ) && isObject( source ) ) {
		for ( const key in source ) {
			if ( isObject( source[ key ] ) ) {
				if ( ! target[ key ] ) Object.assign( target, { [ key ]: {} } );
				deepMerge( target[ key ], source[ key ] );
			} else {
				Object.assign( target, { [ key ]: source[ key ] } );
			}
		}
	}
};

// Get callback.
export const getCallback = ( path ) => {
	let current = window.wpx;
	path.split( '.' ).forEach( ( p ) => ( current = current[ p ] ) );
	return current;
};
