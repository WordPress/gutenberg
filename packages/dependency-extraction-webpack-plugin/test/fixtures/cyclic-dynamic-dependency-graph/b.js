/**
 * Internal dependencies
 */
const { store } = import( './a.js' );

export function identity( x ) {
	return x;
}

export { store };
