/**
 * Normalize selector argument array by defaulting `undefined` value to an empty array
 * and removing trailing `undefined` values.
 *
 * @param args Selector argument array
 * @return Normalized state key array
 */
export function selectorArgsToStateKey( args: unknown[] | null | undefined ) {
	if ( args === undefined || args === null ) {
		return [];
	}

	const len = args.length;
	let idx = len;
	while ( idx > 0 && args[ idx - 1 ] === undefined ) {
		idx--;
	}
	return idx === len ? args : args.slice( 0, idx );
}
