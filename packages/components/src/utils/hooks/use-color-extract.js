/**
 * External dependencies
 */
import { noop } from 'lodash';
import FastAverageColor from 'fast-average-color';

/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */

/**
 *
 * @typedef  UseColorExtractProps
 *
 * @property {string} color The initial color, used to track updates.
 * @property {string} onChange Callback when colors are extracted.
 * @property {Function} src The source of the image to extract colors from.
 */

/**
 *
 * @typedef  UseColorExtractHookProps
 *
 * @property {string} colors The color value extracted from an image source.
 * @property {Function} extractColor An async method (Promise) that extracts color values from the image source.
 */

/**
 * Custom hook that extracts the primary color of an image.
 *
 * This component's extraction technique may not work depending on
 * CORS policy.
 *
 * @example
 *
 * ```js
 * useColorExtract({
 * 		src: '/my-image.png',
 * 		onChange: imageColor => setState(imageColor)
 * })
 * ```
 * @param {UseColorExtractProps} props Props for the custom hook.
 * @return {UseColorExtractHookProps} Values and methods.
 */
export function useColorExtract( {
	color: initialColor,
	onChange = noop,
	src,
} ) {
	const [ color, setColor ] = useState();
	const srcRef = useRef( src );
	const initialColorRef = useRef( initialColor );
	const imageNodeRef = useRef();

	const getImageNode = () => {
		if ( ! imageNodeRef.current ) {
			imageNodeRef.current = document.createElement( 'img' );
			imageNodeRef.current.crossOrigin = 'Anonymous';
		}
		return imageNodeRef.current;
	};

	const extractColor = () => {
		return new Promise( ( resolve, reject ) => {
			try {
				const imageNode = getImageNode();

				imageNode.onload = async () => {
					const extractor = new FastAverageColor();

					extractor.getColorAsync( imageNode, ( data ) => {
						setColor( data.hex );
						resolve( [ data.hex, data ] );
					} );

					srcRef.current = src;
				};
				// Load the image
				if ( src ) {
					imageNode.src = src;
				}
			} catch ( err ) {
				reject( err );
			}
		} );
	};

	useEffect( () => {
		// Guard to quick return if the src does not change
		if ( srcRef.current === src ) {
			return;
		}
		/**
		 * Checks to see if the src changes.
		 * For Cover blocks, the initial src (on load) is undefined.
		 * This tracks to see if an existing src changes to another.
		 */
		const didSrcChange =
			// Initial src exists
			srcRef.current &&
			// Next src exists
			src &&
			// Next src does not match initial src (changed)
			srcRef.current !== src;

		// Guard to handle the initial load of an image (with potential pre-existing color)
		if ( initialColorRef.current && ! didSrcChange ) {
			return;
		}

		extractColor()
			.then( ( [ value, data ] ) => {
				const imageNode = getImageNode();
				onChange( value, { data, node: imageNode } );
			} )
			.catch( ( err ) => {
				// eslint-disable-next-line no-console
				console.err( err );
			} );
	}, [ src ] );

	return {
		color,
		extractColor,
	};
}
