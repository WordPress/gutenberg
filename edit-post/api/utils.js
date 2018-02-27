/* eslint no-console: [ 'error', { allow: [ 'error' ] } ] */

/**
 * Validates the plugin id.
 *
 * @param {string} id Plugin identifier.
 * @return {boolean} Whether the pluginId is valid.
 */
export function validatePluginId( id ) {
	if ( typeof id !== 'string' ) {
		console.error(
			'Plugin identifier must be a string.'
		);
		return false;
	}
	if ( ! /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test( id ) ) {
		console.error(
			'Plugin identifier must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-sidebar'
		);
		return false;
	}
	return true;
}
