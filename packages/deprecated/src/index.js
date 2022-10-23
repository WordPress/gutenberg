/**
 * WordPress dependencies
 */
import { doAction } from '@wordpress/hooks';

/**
 * Object map tracking messages which have been logged, for use in ensuring a
 * message is only logged once.
 *
 * @type {Record<string, true | undefined>}
 */
export const logged = Object.create( null );

/**
 * Logs a message to notify developers about a deprecated feature.
 *
 * @param {string} feature               Name of the deprecated feature.
 * @param {Object} [options]             Personalisation options
 * @param {string} [options.since]       Version in which the feature was deprecated.
 * @param {string} [options.version]     Version in which the feature will be removed.
 * @param {string} [options.alternative] Feature to use instead
 * @param {string} [options.plugin]      Plugin name if it's a plugin feature
 * @param {string} [options.link]        Link to documentation
 * @param {string} [options.hint]        Additional message to help transition away from the deprecated feature.
 *
 * @example
 * ```js
 * import deprecated from '@wordpress/deprecated';
 *
 * deprecated( 'Eating meat', {
 * 	since: '2019.01.01'
 * 	version: '2020.01.01',
 * 	alternative: 'vegetables',
 * 	plugin: 'the earth',
 * 	hint: 'You may find it beneficial to transition gradually.',
 * } );
 *
 * // Logs: 'Eating meat is deprecated since version 2019.01.01 and will be removed from the earth in version 2020.01.01. Please use vegetables instead. Note: You may find it beneficial to transition gradually.'
 * ```
 */
export default function deprecated( feature, options = {} ) {
	const { since, version, alternative, plugin, link, hint } = options;

	const pluginMessage = plugin ? ` from ${ plugin }` : '';
	const sinceMessage = since ? ` since version ${ since }` : '';
	const versionMessage = version
		? ` and will be removed${ pluginMessage } in version ${ version }`
		: '';
	const useInsteadMessage = alternative
		? ` Please use ${ alternative } instead.`
		: '';
	const linkMessage = link ? ` See: ${ link }` : '';
	const hintMessage = hint ? ` Note: ${ hint }` : '';
	const message = `${ feature } is deprecated${ sinceMessage }${ versionMessage }.${ useInsteadMessage }${ linkMessage }${ hintMessage }`;

	// Skip if already logged.
	if ( message in logged ) {
		return;
	}

	/**
	 * Fires whenever a deprecated feature is encountered
	 *
	 * @param {string}  feature             Name of the deprecated feature.
	 * @param {?Object} options             Personalisation options
	 * @param {string}  options.since       Version in which the feature was deprecated.
	 * @param {?string} options.version     Version in which the feature will be removed.
	 * @param {?string} options.alternative Feature to use instead
	 * @param {?string} options.plugin      Plugin name if it's a plugin feature
	 * @param {?string} options.link        Link to documentation
	 * @param {?string} options.hint        Additional message to help transition away from the deprecated feature.
	 * @param {?string} message             Message sent to console.warn
	 */
	doAction( 'deprecated', feature, options, message );

	// eslint-disable-next-line no-console
	console.warn( message );

	logged[ message ] = true;
}

/** @typedef {import('utility-types').NonUndefined<Parameters<typeof deprecated>[1]>} DeprecatedOptions */
