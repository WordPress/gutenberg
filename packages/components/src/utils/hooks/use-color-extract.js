/**
 * External dependencies
 */
import { noop } from 'lodash';
import tinycolor from 'tinycolor2';

/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ColorThief } from './extract-color';

/**
 *
 * @typedef  UseColorExtractProps
 *
 * @property {string} color The initial color, used to track updates.
 * @property {number} numberOfColors Amount of colors to extract.
 * @property {string} onChange Callback when colors are extracted.
 * @property {Function} src The source of the image to extract colors from.
 */

/**
 *
 * @typedef  UseColorExtractHookProps
 *
 * @property {string|Array<string>} colors The color value(s) extracted from an image source.
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
	numberOfColors = 1,
	color: initialColor,
	onChange = noop,
	src,
} ) {
	const [ colors, setColors ] = useState();
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
		const imageNode = getImageNode();
		const isGetPalette = numberOfColors !== 1;

		return new Promise( ( resolve, reject ) => {
			imageNode.onload = () => {
				let data;
				let value;

				try {
					const extractor = new ColorThief();
					const extractedData = isGetPalette
						? extractor.getPalette( imageNode, numberOfColors )
						: extractor.getColor( imageNode );

					if ( isGetPalette ) {
						data = extractedData.map( ( values ) => {
							return tinycolor( {
								r: values[ 0 ],
								g: values[ 1 ],
								b: values[ 2 ],
							} );
						} );
						value = data.map( ( color ) => color.toHexString() );
					} else {
						const [ r, g, b ] = extractedData;
						data = tinycolor( { r, g, b } );
						value = data.toHexString();
					}

					setColors( value );
					resolve( [ value, data ] );
				} catch ( err ) {
					reject( err );
				}
				srcRef.current = src;
			};

			// Load the image
			imageNode.src = src;
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
		colors,
		extractColor,
	};
}
