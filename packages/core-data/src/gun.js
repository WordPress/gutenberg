/**
 * External dependencies
 */
import Gun from 'gun/gun';
import 'gun/lib/then';
import 'gun/lib/open';

/**
 * Gun is a Conflict-free Replicated Data Type (CRDT) based p2p synchronized
 * storage engine.
 *
 * It will automatically convert JSON objects without arrays into
 * CRDTs in a generalized way, but since lots of our entity edits
 * are made up of arrays, we extend Gun here to support them.
 *
 * The extensions provide a way to `open` and `put` items with arrays.
 * They do this by recursively converting arrays into "array objects" with an
 * `_isArray` property when `put`ting them and then recursively converting
 * those objects back into arrays when `open`ing them.
 *
 * When an "array object" in the storage graph is updated, we remove all the
 * indexes from the graph that are not part of the new array. We need to do
 * this, because Gun works by deeply patching/merging the graph.
 *
 * @see https://gun.eco
 */
const gun = Gun( 'http://localhost:8765/gun' ); // URL to lightweight relay server.

Gun.chain.openWithArrays = function( callback ) {
	// Recursively converts "array objects" in items
	// into arrays.
	const parseItem = ( currentItem ) => {
		if ( typeof currentItem === 'object' && currentItem !== null ) {
			let keys = Object.keys( currentItem );
			if ( currentItem._isArray === true ) {
				// Only consider (filled) array indexes.
				keys = keys.filter( ( key ) => ! isNaN( key ) && currentItem[ key ] !== null );
			}

			let parsedItem = keys.reduce( ( acc, key ) => {
				acc[ key ] = parseItem( currentItem[ key ] );
				return acc;
			}, {} );

			if ( currentItem._isArray === true ) {
				// Parse into array.
				parsedItem = keys.map( ( key ) => parsedItem[ key ] );
			}

			return parsedItem;
		}

		return currentItem;
	};

	return this.open( ( item, ...args ) => callback( parseItem( item ), ...args ), {
		wait: 99, // Wait a bit more than the default to avoid partial graphs.
	} );
};

Gun.chain.putWithArrays = async function( item ) {
	const arrayLengths = {};

	// Recursively converts arrays in items
	// into "array objects".
	const normalizeItem = ( currentItem, currentPath = '' ) => {
		if ( typeof currentItem === 'object' && currentItem !== null ) {
			const keys = Object.keys( currentItem );

			const normalizedItem = keys.reduce( ( acc, key ) => {
				acc[ key ] = normalizeItem(
					currentItem[ key ],
					`${ currentPath }${ currentPath ? '.' : '' }${ key }`
				);
				return acc;
			}, {} );

			if ( Array.isArray( currentItem ) ) {
				// Mark converted arrays and cache their length.
				normalizedItem._isArray = true;
				arrayLengths[ currentPath ] = keys.length;
			}

			return normalizedItem;
		}

		// Gun does not support `undefined`.
		return currentItem === undefined ? null : currentItem;
	};
	const normalizedItem = normalizeItem( item );

	// Delete all indexes in updated "array objects" that won't
	// be updated due to being out of range, i.e. not existing
	// anymore.
	await Promise.all(
		Object.keys( arrayLengths ).map( async ( path ) => {
			// Get the "array object" at the cached path.
			let chain = this;
			if ( path ) {
				path.split( '.' ).forEach( ( key ) => ( chain = chain.get( key ) ) );
			}
			const arrayObject = await chain.once( () => {}, { wait: 2000 } ).then();

			// Make sure the "array object" exists already.
			if ( arrayObject ) {
				return Promise.all(
					Object.keys( arrayObject ).map( ( key ) => {
						// Delete any non-metadata key that is not an
						// array index in the new array.
						if (
							isNaN( key ) ?
								key !== '_' && key !== '_isArray' :
								Number( key ) >= arrayLengths[ path ]
						) {
							return chain
								.get( key )
								.put( null )
								.then();
						}

						return Promise.resolve();
					} )
				);
			}

			return Promise.resolve();
		} )
	);

	return this.put( normalizedItem );
};

export default gun;
