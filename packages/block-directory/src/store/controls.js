/**
 * Loads a JavaScript file.
 *
 * @param {string} asset The url for this file.
 *
 * @return {Promise} Promise which will resolve when the asset is loaded.
 */
export const loadScript = ( asset ) => {
	if ( ! asset ) {
		return Promise.reject( new Error( 'No script found.' ) );
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
	if ( ! asset ) {
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
 * @param {Array} assets A collection of URLs for the assets.
 *
 * @return {Object} Control descriptor.
 */
export function loadAssets( assets ) {
	return {
		type: 'LOAD_ASSETS',
		assets,
	};
}

const controls = {
	LOAD_ASSETS( { assets } ) {
		const scripts = assets.map( ( asset ) =>
			asset.match( /\.js$/ ) !== null
				? loadScript( asset )
				: loadStyle( asset )
		);

		return Promise.all( scripts );
	},
};

export default controls;
