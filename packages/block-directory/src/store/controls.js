/**
 * External dependencies
 */
import { forEach } from 'lodash';
/**
 * Loads JavaScript
 *
 * @param {Array}    asset   The url for the JavaScript.
 * @param {Function} onLoad  Callback function on success.
 * @param {Function} onError Callback function on failure.
 */
const loadScript = ( asset, onLoad, onError ) => {
	if ( ! asset ) {
		return;
	}
	const existing = document.querySelector( `script[src="${ asset.src }"]` );
	if ( existing ) {
		existing.parentNode.removeChild( existing );
	}
	const script = document.createElement( 'script' );
	script.src = typeof asset === 'string' ? asset : asset.src;
	script.onload = onLoad;
	script.onerror = onError;
	document.body.appendChild( script );
};

/**
 * Loads CSS file.
 *
 * @param {*} asset the url for the CSS file.
 */
const loadStyle = ( asset ) => {
	if ( ! asset ) {
		return;
	}
	const link = document.createElement( 'link' );
	link.rel = 'stylesheet';
	link.href = typeof asset === 'string' ? asset : asset.src;
	document.body.appendChild( link );
};

/**
 * Load the asset files for a block
 *
 * @param {Array} assets A collection of URL for the assets.
 *
 * @return {Object} Control descriptor.
 */
export function* loadAssets( assets ) {
	return {
		type: 'LOAD_ASSETS',
		assets,
	};
}

const controls = {
	LOAD_ASSETS( { assets } ) {
		return new Promise( ( resolve, reject ) => {
			if ( Array.isArray( assets ) ) {
				let scriptsCount = 0;

				forEach( assets, ( asset ) => {
					if ( asset.match( /\.js$/ ) !== null ) {
						scriptsCount++;
						loadScript(
							asset,
							() => {
								scriptsCount--;
								if ( scriptsCount === 0 ) {
									return resolve( scriptsCount );
								}
							},
							reject
						);
					} else {
						loadStyle( asset );
					}
				} );
			}
		} );
	},
};

export default controls;
