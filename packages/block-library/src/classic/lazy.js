/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { speak } from '@wordpress/a11y';
import { __ } from '@wordpress/i18n';

const alreadyLoadedURIs = new Set();

const loadTinyMCEScripts = () =>
	window.wpTinyMCEOrderedScriptURIs.reduce( ( previousPromise, uri ) => {
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
				alreadyLoadedURIs.add( uri );
			} )
		);
	}, Promise.resolve() );

const LazyLoadTinyMCE = ( { children } ) => {
	/**
	 * TinyMCE has already been loaded. This happens on page-load
	 * when a the post type has custom metaboxes or, more commonly,
	 * when TinyMCE was already lazily-loaded for another instance
	 * of the classic block.
	 *
	 * In this case there's nothing to lazily load, so we can go ahead
	 * and set `isLoaded` to true.
	 */
	const isTinyMCEAlreadyLoaded = typeof window.tinymce !== 'undefined';

	const [ isLoaded, setIsLoaded ] = useState( isTinyMCEAlreadyLoaded );
	useEffect( () => {
		if ( isLoaded ) {
			// no dependencies to load if it's already loaded!
			return;
		}

		speak( __( 'The classic block is loading.' ) );

		loadTinyMCEScripts().then( () => {
			window.wpMceTranslation();
			setIsLoaded( true );
			speak( __( 'The classic block has finished loading.' ) );
		} );
	}, [ isLoaded ] );

	return isLoaded ? children : null;
};

export default LazyLoadTinyMCE;
