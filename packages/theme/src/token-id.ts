/**
 * Normalizes a token ID by removing default states and visibility identifiers,
 * making it human-readable as a publicly-accessible variable name.
 *
 * @param id The token ID to normalize.
 * @return The normalized token ID.
 */
export const publicTokenId = ( id: string ) =>
	id.replace( /\.(normal|resting|semantic|primitive)/g, '' );
