/**
 * External dependencies
 */
import { forEach } from 'lodash';

/**
 * WordPress dependencies
 */
import { createRegistryControl } from '@wordpress/data';
import wpApiFetch from '@wordpress/api-fetch';

/**
 * Calls a selector using the current state.
 *
 * @param {string} storeName    Store name.
 * @param {string} selectorName Selector name.
 * @param {Array}  args         Selector arguments.
 *
 * @return {Object} Control descriptor.
 */
export function select( storeName, selectorName, ...args ) {
	return {
		type: 'SELECT',
		storeName,
		selectorName,
		args,
	};
}

/**
 * Calls a dispatcher using the current state.
 *
 * @param {string} storeName      Store name.
 * @param {string} dispatcherName Dispatcher name.
 * @param {Array}  args           Selector arguments.
 *
 * @return {Object} Control descriptor.
 */
export function dispatch( storeName, dispatcherName, ...args ) {
	return {
		type: 'DISPATCH',
		storeName,
		dispatcherName,
		args,
	};
}

/**
 * Trigger an API Fetch request.
 *
 * @param {Object} request API Fetch Request Object.
 *
 * @return {Object} Control descriptor.
 */
export function apiFetch( request ) {
	return {
		type: 'API_FETCH',
		request,
	};
}

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
	SELECT: createRegistryControl(
		( registry ) => ( { storeName, selectorName, args } ) => {
			return registry.select( storeName )[ selectorName ]( ...args );
		}
	),
	DISPATCH: createRegistryControl(
		( registry ) => ( { storeName, dispatcherName, args } ) => {
			return registry.dispatch( storeName )[ dispatcherName ]( ...args );
		}
	),
	API_FETCH( { request } ) {
		return wpApiFetch( { ...request } );
	},
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
			} else {
				loadScript(
					assets.editor_script,
					() => {
						return resolve( 0 );
					},
					reject
				);
				loadStyle( assets.style );
			}
		} );
	},
};

export default controls;
