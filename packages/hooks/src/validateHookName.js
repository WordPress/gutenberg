/**
 * Validate a hook name.
 *
 * @param  {string} hookName The hook name to validate.
 *
 * @return {bool}            Whether the hook name is valid.
 */
function validateHookName( hookName ) {

	if ( 'string' !== typeof hookName ) {
		console.error( 'The hook name must be a string.' );
		return false;
	}

	if ( /^__/.test( hookName ) ) {
		console.error( 'The hook name cannot begin with `__`.' );
		return false;
	}

	if ( ! /^[a-z][a-z0-9_.-]*$/.test( hookName ) ) {
		console.error( 'The hook name can only contain numbers, letters, dashes, periods and underscores.' );
		return false;
	}

	return true;
}

export default validateHookName;
