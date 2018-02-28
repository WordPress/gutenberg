/* eslint no-console: [ 'error', { allow: [ 'error' ] } ] */

/**
 * Validates the namespaced id.
 *
 * A namespaced id should be formatted like this: "namespace/identifier".
 * It can only contain lowercase alphanumeric characters and dashes.
 *
 * If a namespace id is invalid, it will print a console error, optionally using
 * the name of the thing it identifies.
 *
 * @param {string} id Namespaced identifier.
 * @param {string} [name] Plural name of what the id is for, defaults to "Namespaced identifiers".
 * @return {boolean} Whether the id is valid.
 */
export function validateNamespacedId( id, name = 'Namespaced identifiers' ) {
	if ( typeof id !== 'string' ) {
		console.error(
			wp.i18n.sprintf( '%s must be strings.', name )
		);
		return false;
	}
	if ( ! /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test( id ) ) {
		console.error(
			wp.i18n.sprintf( '%s must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-id', name )
		);
		return false;
	}
	return true;
}
