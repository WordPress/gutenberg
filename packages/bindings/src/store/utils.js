/**
 * The register `key` is based on the source name,
 * and the arguments key-value pairs.
 *
 * @param {Object} settings        - Settings.
 * @param {string} settings.source - The source handler name.
 * @param {Object} settings.args   - The binding arguments.
 *
 * @return {string|undefined}        The generated key.
 */
export function generateSourcePropertyKey( { source, args } = {} ) {
	if ( ! source?.length || ! args ) {
		return;
	}

	return `${ source }|${ JSON.stringify( args ).replace( /{|}|"/g, '' ) }`;
}
