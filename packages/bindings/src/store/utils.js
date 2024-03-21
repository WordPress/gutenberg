/**
 * The register `key` is based on the source name,
 * and the arguments key-value pairs.
 *
 * @param {string} source - Name of the source.
 * @param {Object} args   - Arguments for the source.
 * @return {string}         The generated key.
 */
export function generateSourcePropertyKey( source, args ) {
	return `${ source }|${ JSON.stringify( args ).replace( /{|}|"/g, '' ) }`;
}
