/**
 * Look up each of one or more keys, and separate the items found from the keys
 * that have no item.
 *
 * @param keys - The key, or keys, to look up.
 * @param find - Returns the item for a key, or null if there is none.
 * @return The items found, and the keys without an item.
 */
export async function findEach< T >(
	keys: string | string[],
	find: ( key: string ) => Promise< T | null >
): Promise< { found: T[]; missing: string[] } > {
	const found: T[] = [];
	const missing: string[] = [];

	// Look up keys in order, so that only the first lookup fetches the data.
	for ( const key of Array.isArray( keys ) ? keys : [ keys ] ) {
		const item = await find( key );
		if ( item ) {
			found.push( item );
		} else {
			missing.push( key );
		}
	}

	return { found, missing };
}
