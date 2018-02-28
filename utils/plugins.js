/* eslint no-console: [ 'error', { allow: [ 'error' ] } ] */

/**
 * Validates the plugin id.
 *
 * @param {string} id Plugin identifier.
 * @param {string} [pluginName] Plugin name.
 * @return {boolean} Whether the pluginId is valid.
 */
export function validatePluginId( id, pluginName = 'Plugin identifiers' ) {
	if ( typeof id !== 'string' ) {
		console.error(
			wp.i18n.sprintf( '%s must be strings.', pluginName )
		);
		return false;
	}
	if ( ! /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test( id ) ) {
		console.error(
			wp.i18n.sprintf( '%s must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-plugin', pluginName )
		);
		return false;
	}
	return true;
}
