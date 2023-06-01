/**
 * External dependencies
 */
const fs = require( 'fs' );
const crypto = require( 'crypto' );

const API_URL = 'https://www.googleapis.com/webfonts/v1/webfonts?key=';
const API_KEY = process.env.GOOGLE_FONTS_API_KEY;
const GOOGLE_FONTS_FILE_PATH =
	'../../lib/experimental/fonts-library/google-fonts.json';

function getCategories( fonts ) {
	const categories = new Set();
	fonts.forEach( ( font ) => {
		categories.add( font.category );
	} );
	// Returs an array of categories
	return [ ...categories ];
}

function calculateHash( somestring ) {
	return crypto
		.createHash( 'md5' )
		.update( somestring )
		.digest( 'hex' )
		.toString();
}

// Google Fonts API categories mappping to fallback system fonts
const GOOGLE_FONT_FALLBACKS = {
	display: 'system-ui',
	'sans-serif': 'sans-serif',
	serif: 'serif',
	handwriting: 'cursive',
	monospace: 'monospace',
};

function getStyleFromGoogleVariant( variant ) {
	return variant.includes( 'italic' ) ? 'italic' : 'normal';
}

function getWeightFromGoogleVariant( variant ) {
	return variant === 'regular' || variant === 'italic'
		? '400'
		: variant.replace( 'italic', '' );
}

function getFallbackForGoogleFont( googleFontCategory ) {
	return GOOGLE_FONT_FALLBACKS[ googleFontCategory ] || 'system-ui';
}

function getFontFamilyFromGoogleFont( font ) {
	return {
		name: font.family,
		fontFamily: `${ font.family }, ${ getFallbackForGoogleFont(
			font.category
		) }`,
		slug: 'wp-font-lib-' + font.family.replace( /\s+/g, '-' ).toLowerCase(),
		category: font.category,
		fontFace: font.variants.map( ( variant ) => ( {
			src: font.files?.[ variant ],
			fontWeight: getWeightFromGoogleVariant( variant ),
			fontStyle: getStyleFromGoogleVariant( variant ),
			fontFamily: font.family,
		} ) ),
	};
}

async function updateFiles() {
	let newApiData;
	let newData;
	let response;

	try {
		newApiData = await fetch( `${ API_URL }${ API_KEY }` );
		response = await newApiData.json();
		const fontFamilies = response.items.map( getFontFamilyFromGoogleFont );
		const categories = getCategories( response.items );
		newData = { fontFamilies, categories };
	} catch ( error ) {
		// TODO: show in UI and remove console statement
		// eslint-disable-next-line
		console.error( '❎  Error fetching the Google Fonts API:', error );
		process.exit( 1 );
	}

	if ( response.items ) {
		const newDataString = JSON.stringify( newData, null, 2 );

		const oldFileData = fs.readFileSync( GOOGLE_FONTS_FILE_PATH, 'utf8' );
		const oldData = JSON.parse( oldFileData );
		const oldDataString = JSON.stringify( oldData, null, 2 );

		if (
			calculateHash( newDataString ) !== calculateHash( oldDataString )
		) {
			fs.writeFileSync( GOOGLE_FONTS_FILE_PATH, newDataString );
			// TODO: show in UI and remove console statement
			// eslint-disable-next-line
			console.info( '✅  Google Fonts JSON file updated' );
		} else {
			// TODO: show in UI and remove console statement
			// eslint-disable-next-line
			console.info( 'ℹ️  Google Fonts JSON file is up to date' );
		}
	} else {
		// TODO: show in UI and remove console statement
		// eslint-disable-next-line
		console.error(
			'❎  No new data to check. Check the Google Fonts API key.'
		);
		process.exit( 1 );
	}
}

updateFiles();
