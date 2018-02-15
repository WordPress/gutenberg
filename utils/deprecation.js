/**
 * Logs a message to notify developpers about a deprecated feature.
 *
 * @param {string}  feature     Name of the deprecated feature.
 * @param {?string} version     Version in which the feature will be removed.
 * @param {?string}  useInstead Feature to use instead
 * @param {?string}  plugin     Plugin name if it's a plugin feature
 * @param {?string}  link       Link to documentation
 */
export function deprecated( feature, version, useInstead, plugin, link ) {
	const pluginMessage = plugin ? ` from ${ plugin }` : '';
	const versionMessage = version ? `${ pluginMessage } in ${ version }` : '';
	const useInsteadMessage = useInstead ? ` Please use ${ useInstead } instead.` : '';
	const linkMessage = link ? ` See: ${ link }` : '';
	const message = `${ feature } is deprecated and will be removed${ versionMessage }.${ useInsteadMessage }${ linkMessage }`;

	// eslint-disable-next-line no-console
	console.warn( message );
}
