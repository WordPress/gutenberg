/**
 * WordPress dependencies
 */
import { setLocaleData } from '@wordpress/i18n';

export default ( { locale, extraTranslations, domain, getTranslation } ) => {
	let gutenbergTranslations = getTranslation( locale );
	if ( locale && ! gutenbergTranslations ) {
		// Try stripping out the regional
		locale = locale.replace( /[-_][A-Za-z]+$/, '' );
		gutenbergTranslations = getTranslation( locale );
	}
	const translations = Object.assign(
		{},
		gutenbergTranslations,
		extraTranslations
	);
	// eslint-disable-next-line no-console
	console.log(
		domain ? `${ domain } - locale` : 'locale',
		locale,
		translations
	);
	// Only change the locale if it's supported by gutenberg
	if ( gutenbergTranslations || extraTranslations ) {
		setLocaleData( translations, domain );
	}
};
