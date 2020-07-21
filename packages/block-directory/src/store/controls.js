/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { getPath } from '@wordpress/url';
import { setLocaleData } from '@wordpress/i18n';

/**
 * Loads a JavaScript file.
 *
 * @param {string} asset The url for this file.
 * @param {Object} translationUrl URL to the JSON files with translations for this asset.
 * @param {string} domain The textdomain for this plugin.
 *
 * @return {Promise} Promise which will resolve when the asset is loaded.
 */
export const loadScript = async ( asset, translationUrl = false, domain ) => {
	if ( ! asset || ! /\.js$/.test( getPath( asset ) ) ) {
		return Promise.reject( new Error( 'No script found.' ) );
	}
	// Fetch the translation content & inject it into the client before loading the script.
	if ( translationUrl ) {
		const translations = await apiFetch( {
			url: translationUrl,
			mode: 'no-cors',
		} );
		const localeData =
			translations.locale_data[ domain ] ||
			translations.locale_data.messages;
		localeData[ '' ].domain = domain;
		setLocaleData( localeData, domain );
	}

	return new Promise( ( resolve, reject ) => {
		const existing = document.querySelector( `script[src="${ asset }"]` );
		if ( existing ) {
			existing.parentNode.removeChild( existing );
		}
		const script = document.createElement( 'script' );
		script.src = asset;
		script.onload = () => resolve( true );
		script.onerror = () => reject( new Error( 'Error loading script.' ) );
		document.body.appendChild( script );
	} );
};

/**
 * Loads a CSS file.
 *
 * @param {string} asset The url for this file.
 *
 * @return {Promise} Promise which will resolve when the asset is added.
 */
export const loadStyle = ( asset ) => {
	if ( ! asset || ! /\.css$/.test( getPath( asset ) ) ) {
		return Promise.reject( new Error( 'No style found.' ) );
	}
	return new Promise( ( resolve, reject ) => {
		const link = document.createElement( 'link' );
		link.rel = 'stylesheet';
		link.href = asset;
		link.onload = () => resolve( true );
		link.onerror = () => reject( new Error( 'Error loading style.' ) );
		document.body.appendChild( link );
	} );
};

/**
 * Load the asset files for a block
 *
 * @param {Object} block The selected block.
 *
 * @return {Object} Control descriptor.
 */
export function loadAssets( block ) {
	return {
		type: 'LOAD_ASSETS',
		block,
	};
}

const controls = {
	LOAD_ASSETS( { block } ) {
		const { assets, translations, slug } = block;
		const scripts = assets.map( ( asset ) =>
			getPath( asset ).match( /\.js$/ ) !== null
				? loadScript( asset, translations[ asset ], slug )
				: loadStyle( asset )
		);

		return Promise.all( scripts );
	},
};

export default controls;
