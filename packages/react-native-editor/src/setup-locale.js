/**
 * WordPress dependencies
 */
import { setLocaleData } from '@wordpress/i18n';

/**
 * Setup locale data for default domain and plugins.
 *
 * @typedef {Object} PluginTranslation
 * @property {string}              domain                Domain of the plugin.
 * @property {Function}            getTranslation        Function for retrieving translations for a locale.
 *
 * @param    {string}              locale                Locale value.
 * @param    {Object}              extraTranslations     Extra translations to be included.
 * @param    {Function}            getDefaultTranslation Default domain's function for retrieving translations for a locale.
 * @param    {PluginTranslation[]} pluginTranslations    Array with plugin translations.
 */
export default (
	locale,
	extraTranslations,
	getDefaultTranslation,
	pluginTranslations = []
) => {
	const setDomainLocaleData = ( { getTranslation, domain = 'default' } ) => {
		// Lowercase the locale value as translation filenames are also lowercased.
		locale = locale?.toLowerCase();
		let translations = getTranslation( locale );
		if ( locale && ! translations ) {
			// Try stripping out the regional
			locale = locale.replace( /[-_][A-Za-z]+$/, '' );
			translations = getTranslation( locale );
		}
		const allTranslations = {
			...translations,
			...extraTranslations,
		};

		// Only change the locale if it's supported by gutenberg
		if ( translations || extraTranslations ) {
			setLocaleData( allTranslations, domain );
		}
	};

	// Set up default domain and plugin translations
	[
		{ getTranslation: getDefaultTranslation },
		...pluginTranslations,
	].forEach( setDomainLocaleData );
};
