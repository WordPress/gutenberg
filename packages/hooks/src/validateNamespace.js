/**
 * Validate a namespace string.
 *
 * @param  {string} namespace The namespace to validate - should take the form
 *                            `vendor/plugin/function`.
 *
 * @return {bool}             Whether the namespace is valid.
 */
function validateNamespace( namespace ) {

	if ( 'string' !== typeof namespace || '' === namespace ) {
		console.error( 'The namespace must be a non-empty string.' );
		return false;
	}

	if ( ! /^[a-zA-Z][a-zA-Z0-9_.\-\/]*$/.test( namespace ) ) {
		console.error( 'The namespace can only contain numbers, letters, dashes, periods, underscores and slashes.' );
		return false;
	}

	return true;
}

export default validateNamespace;
