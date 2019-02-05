// External dependencies
const fs = require( 'fs' );
const path = require( 'path' );
const fetch = require("node-fetch");

// Internal dependencies
const languages = require( './languages' );

const defaultLocale = 'en';

const getLanguageUrl = locale => `https://widgets.wp.com/languages/gutenberg/${ locale }.json`;

const getLocaleFilePath = locale => path.resolve( __dirname, 'data', `${ locale }.json` );

const fetchTranslation = locale => {
	if ( ! process.env.REFRESH_I18N_CACHE && fs.existsSync( getLocaleFilePath( locale ) ) ) {
		console.log( `Using cached locale data for ${ locale }` );
		return;
	}

	console.log( 'fetching', getLanguageUrl( locale ) );
	return fetch( getLanguageUrl( locale ) ).then( ( response ) => response.json() ).then( ( body ) => {
		return { response: body, locale };
	} );
};

const getTranslation = locale => {
	const filePath = getLocaleFilePath( locale );

	if ( fs.existsSync( filePath ) ) {
		return JSON.parse( fs.readFileSync( filePath, 'utf8' ) );
	}
};

const fetchTranslations = () => {
	const fetchPromises = languages
		.filter( language => language.langSlug !== defaultLocale )
		.map( language => fetchTranslation( language.langSlug ) );

	return Promise.all( fetchPromises ).then( ( results ) => {
		const translationFilePromises = results.map( languageResult => {
			return fs.writeFileSync( getLocaleFilePath( languageResult.locale ), JSON.stringify( languageResult.response ), 'utf8' );
		} );
		return Promise.all( translationFilePromises );
	} );
};

if ( require.main === module ) {
	fetchTranslations().then( () => {
		console.log( 'Done.' );
	} );
}

module.exports = {
	getTranslation,
	fetchTranslations
};
