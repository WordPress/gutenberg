/**
 * External dependencies
 */
import createEmotion from 'create-emotion';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

export const globalStylesManager = createEmotion( {
	key: 'wp-gs',
	speedy: true,
} );

export const getGlobalStylesSheetAsCssStringSync = () => {
	const { registered } = globalStylesManager.cache;
	return Object.keys( registered )
		.reduce( ( html, key ) => {
			return [ ...html, `.${ key }{${ registered[ key ] }}` ];
		}, [] )
		.join( '\n' );
};

export const getGlobalStylesSheetAsCssString = () => {
	return new Promise( ( resolve ) => {
		/**
		 * Gives cache.flush() a chance to resolve before
		 * compiling CSS HTML string.
		 */
		window.requestAnimationFrame( () => {
			resolve( getGlobalStylesSheetAsCssStringSync() );
		} );
	} );
};

export const useGlobalStylesSheetCssString = () => {
	const [ css, setCss ] = useState( '' );
	useEffect( () => {
		getGlobalStylesSheetAsCssString().then( setCss );
	}, [ setCss ] );

	return css;
};
