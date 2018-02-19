/**
 * Logs a message to notify developpers about a deprecated feature.
 *
 * @param {string}  feature             Name of the deprecated feature.
 * @param {?Object} options             Personalisation options
 * @param {?string} options.version     Version in which the feature will be removed.
 * @param {?string} options.alternative Feature to use instead
 * @param {?string} options.plugin      Plugin name if it's a plugin feature
 * @param {?string} options.link        Link to documentation
 */
export function deprecated( feature, { version, alternative, plugin, link } = {} ) {
	const pluginMessage = plugin ? ` from ${ plugin }` : '';
	const versionMessage = version ? `${ pluginMessage } in ${ version }` : '';
	const useInsteadMessage = alternative ? ` Please use ${ alternative } instead.` : '';
	const linkMessage = link ? ` See: ${ link }` : '';
	const message = `${ feature } is deprecated and will be removed${ versionMessage }.${ useInsteadMessage }${ linkMessage }`;

	// eslint-disable-next-line no-console
	console.warn( message );
}
