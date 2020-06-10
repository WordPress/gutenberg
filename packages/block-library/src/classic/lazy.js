/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

const loadTinyMCEScripts = async () =>
	window.wpTinyMCEOrderedScriptURIs.reduce(
		async ( previousPromise, uri ) => {
			// we need to serially load depenendencies as each could depend on the previous
			await previousPromise;
			return new Promise( ( resolve, reject ) => {
				const scriptElement = document.createElement( 'script' );
				scriptElement.type = 'application/javascript';
				scriptElement.src = uri;
				scriptElement.onload = resolve;
				scriptElement.onerror = reject;
				document.head.appendChild( scriptElement );
			} );
		},
		Promise.resolve()
	);

const LazyLoadTinyMCE = ( { children, placeholder } ) => {
	const [ isLoaded, setIsLoaded ] = useState( false );
	useEffect( () => {
		loadTinyMCEScripts().then( () => {
			window.wpMceTranslation();
			setIsLoaded( true );
		} );
	}, [] );

	return isLoaded ? children : placeholder;
};

LazyLoadTinyMCE.defaultProps = {
	placeholder: null,
};

export default LazyLoadTinyMCE;
