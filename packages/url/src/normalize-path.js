/**
 * Given a path, returns a normalized path where equal query parameter values
 * will be treated as identical, regardless of order they appear in the original
 * text.
 *
 * @param {string} path Original path.
 *
 * @return {string} Normalized path.
 */
export function normalizePath( path ) {
	const splitted = path.split( '?' );
	const query = splitted[ 1 ];
	const base = splitted[ 0 ];
	if ( ! query ) {
		return base;
	}

	const searchParams = new URLSearchParams( query );
	searchParams.sort();

	return `${ base }?${ searchParams.toString() }`;
}
