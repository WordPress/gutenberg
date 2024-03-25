/**
 * Generates a key for a bindings connection,
 * based on the source handler name and the binding arguments.
 *
 * @param {Object} settings        - Settings.
 * @param {string} settings.source - The source handler name.
 * @param {Object} settings.args   - The binding arguments.
 * @return {string|undefined}        The generated key.
 */
export function generateBindingsConnectionKey( { source, args } = {} ) {
	if ( ! source?.length || ! args ) {
		return;
	}

	return `${ source }|${ JSON.stringify( args ).replace( /{|}|"/g, '' ) }`;
}
