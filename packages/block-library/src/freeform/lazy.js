/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

const alreadyLoadedURIs = new Set();

const loadTinyMCEScripts = async () => {
	let count;
	await window.wpTinyMCEOrderedScriptURIs.reduce(
		( previousPromise, uri ) => {
			if ( alreadyLoadedURIs.has( uri ) ) {
				// if the dependency has already been loaded, skip it
				return previousPromise;
			}

			// we need to serially load depenendencies as each could depend on the previous
			return previousPromise.then( () =>
				new Promise( ( resolve, reject ) => {
					const scriptElement = document.createElement( 'script' );
					scriptElement.type = 'application/javascript';
					scriptElement.src = uri;
					scriptElement.onload = resolve;
					scriptElement.onerror = reject;
					document.head.appendChild( scriptElement );
				} ).then( () => {
					count++;
					alreadyLoadedURIs.add( uri );
				} )
			);
		},
		Promise.resolve()
	);
	return count;
};

const LazyLoadTinyMCE = ( { children, placeholder } ) => {
	const [ isLoaded, setIsLoaded ] = useState( false );
	useEffect( () => {
		loadTinyMCEScripts().then( ( loadedCount ) => {
			if ( loadedCount > 0 ) {
				/**
				 * In the case when all the dependencies have already been loaded
				 * for another instance of the classic block, we don't need to re-init
				 * the translations, so we can safely skip it if the loaded count is 0.
				 */
				window.wpMceTranslation();
			}
			setIsLoaded( true );
		} );
	}, [] );

	return isLoaded ? children : placeholder;
};

LazyLoadTinyMCE.defaultProps = {
	placeholder: null,
};

export default LazyLoadTinyMCE;
