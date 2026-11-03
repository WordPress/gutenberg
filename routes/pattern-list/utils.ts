/**
 * Removes patterns whose name was already used by an earlier pattern in the
 * list, keeping the first occurrence.
 *
 * @param patterns Pattern list.
 * @return Pattern list without duplicates.
 */
export function filterOutDuplicatesByName< T extends { name: string } >(
	patterns: T[]
): T[] {
	const names = new Set< string >();
	return patterns.filter( ( { name } ) => {
		if ( names.has( name ) ) {
			return false;
		}
		names.add( name );
		return true;
	} );
}
