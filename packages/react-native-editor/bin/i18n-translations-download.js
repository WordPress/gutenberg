#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const fetch = require( 'node-fetch' );

const supportedLocales = [
	'ar', // Arabic
	'bg', // Bulgarian
	'bo', // Tibetan
	'ca', // Catalan
	'cs', // Czech
	'cy', // Welsh
	'da', // Danish
	'de', // German
	'en-au', // English (Australia)
	'en-ca', // English (Canada)
	'en-gb', // English (UK)
	'en-nz', // English (New Zealand)
	'en-za', // English (South Africa)
	'el', // Greek
	'es', // Spanish
	'es-ar', // Spanish (Argentina)
	'es-cl', // Spanish (Chile)
	'es-cr', // Spanish (Costa Rica)
	'fa', // Persian
	'fr', // French
	'gl', // Galician
	'he', // Hebrew
	'hr', // Croatian
	'hu', // Hungarian
	'id', // Indonesian
	'is', // Icelandic
	'it', // Italian
	'ja', // Japanese
	'ka', // Georgian
	'ko', // Korean
	'nb', // Norwegian (Bokmål)
	'nl', // Dutch
	'nl-be', // Dutch (Belgium)
	'pl', // Polish
	'pt', // Portuguese
	'pt-br', // Portuguese (Brazil)
	'ro', // Romainian
	'ru', // Russian
	'sk', // Slovak
	'sq', // Albanian
	'sr', // Serbian
	'sv', // Swedish
	'th', // Thai
	'tr', // Turkish
	'uk', // Ukrainian
	'ur', // Urdu
	'vi', // Vietnamese
	'zh-cn', // Chinese (China)
	'zh-tw', // Chinese (Taiwan)
];

const getLanguageUrl = ( locale, plugin ) =>
	`https://translate.wordpress.org/projects/wp-plugins/${ plugin }/dev/${ locale }/default/export-translations\?format\=json`;

const getTranslationFilePath = ( locale ) => `./data/${ locale }.json`;

const fetchTranslation = ( locale, plugin ) => {
	const localeUrl = getLanguageUrl( locale, plugin );
	return fetch( localeUrl )
		.then( ( response ) => response.json() )
		.then( ( body ) => {
			return { response: body, locale };
		} )
		.catch( () => {
			console.error( `Could not find translation file ${ localeUrl }` );
		} );
};

const fetchTranslations = ( { plugin, pluginDir, usedStrings } ) => {
	console.log(
		`Fetching translations of plugin "${ plugin }" for the following locales:`,
		supportedLocales
	);

	const fetchPromises = supportedLocales.map( ( locale ) =>
		fetchTranslation( locale, plugin )
	);

	// Create data folder if it doesn't exist
	const dataDir = path.join( pluginDir, 'data' );
	if ( ! fs.existsSync( dataDir ) ) {
		fs.mkdirSync( dataDir );
	}

	let missingTranslations = [];
	let extraTranslations = [];

	return Promise.all( fetchPromises ).then( ( results ) => {
		const fetchedTranslations = results.filter( Boolean );
		const translationFilePromises = fetchedTranslations.map(
			( languageResult ) => {
				return new Promise( ( resolve, reject ) => {
					const translationRelativePath = getTranslationFilePath(
						languageResult.locale,
						plugin
					);

					const translationAbsolutePath = path.resolve(
						pluginDir,
						translationRelativePath
					);

					// Detect potential missing strings from translations
					missingTranslations = Object.values( usedStrings ).reduce(
						( result, { string, platforms } ) => {
							const stringExists = !! languageResult.response[
								string
							];
							const isMissingString =
								! stringExists && platforms.includes( 'web' );

							return isMissingString &&
								! result.includes( string )
								? [ ...result, string ]
								: result;
						},
						missingTranslations
					);

					// Detect potential native-only strings that are already included in translations
					extraTranslations = Object.values( usedStrings ).reduce(
						( result, { string, platforms } ) => {
							const stringExists = !! languageResult.response[
								string
							];
							const isNativeTranslationIncluded =
								! platforms.includes( 'web' ) && stringExists;

							return ! result.includes( string ) &&
								isNativeTranslationIncluded
								? [ ...result, string ]
								: result;
						},
						extraTranslations
					);

					// Process translations and filter out unused strings if provided
					const translationData =
						Object.keys( usedStrings ).length > 0
							? Object.keys( languageResult.response )
									.filter(
										( string ) => !! usedStrings[ string ]
									)
									.reduce(
										( result, string ) => ( {
											...result,
											[ string ]:
												languageResult.response[
													string
												],
										} ),
										{}
									)
							: languageResult.response;

					// Write translations to file
					fs.writeFile(
						translationAbsolutePath,
						JSON.stringify( translationData, null, 2 ),
						'utf8',
						( err ) => {
							if ( err ) {
								reject( err );
							} else {
								languageResult.path = translationRelativePath;
								resolve( translationRelativePath );
							}
						}
					);
				} );
			}
		);
		return Promise.all( translationFilePromises ).then( () => ( {
			translations: fetchedTranslations,
			missingTranslations,
			extraTranslations,
		} ) );
	} );
};

// Returns used strings of a specified domain
const getUsedStrings = ( usedStringsFile, domain ) => {
	const usedStrings = require( path.resolve( usedStringsFile ) );
	return usedStrings[ domain ];
};

const generateIndexFile = ( translations, pluginDir ) => {
	const indexNative = `/* THIS IS A GENERATED FILE. DO NOT EDIT DIRECTLY. */
/* eslint-disable prettier/prettier */
	
	const translations = {
	${ translations
		.filter( Boolean )
		.map(
			( translation ) =>
				`\t"${ translation.locale }": require( "${ translation.path }" ),`
		)
		.join( '\n' ) }
	};
	
	export const getTranslation = ( locale ) => translations[ locale ];
	
/* eslint-enable prettier/prettier */
`;

	fs.writeFile(
		path.join( pluginDir, 'index.js' ),
		indexNative,
		'utf8',
		( error ) => {
			if ( error ) {
				console.error( error );
				return;
			}
			console.log( 'Done.' );
		}
	);
};

// if run as a script
if ( require.main === module ) {
	const args = process.argv.slice( 2 );
	const plugin = args[ 0 ] || 'gutenberg';
	const destination = args[ 1 ] || './i18n-cache';
	const usedStringsFile = args[ 2 ];

	const translationsDir = path.resolve( destination );
	const pluginDir = path.join( translationsDir, plugin );
	fs.mkdirSync( pluginDir, { recursive: true } );

	const usedStrings = usedStringsFile
		? getUsedStrings( usedStringsFile, plugin )
		: [];

	fetchTranslations( {
		plugin,
		pluginDir,
		usedStrings,
	} ).then( ( { translations, missingTranslations, extraTranslations } ) => {
		if ( missingTranslations.length > 0 ) {
			console.log(
				'WARNING: The following strings are missing from translations:'
			);
			console.log( missingTranslations );
		}

		if ( extraTranslations.length > 0 ) {
			console.log(
				'WARNING: The following native-only strings are already being included in translations:'
			);
			console.log( extraTranslations );
		}

		generateIndexFile( translations, pluginDir );
	} );
}

/* eslint-enable no-console */
