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
 * @property {boolean} disableChangeOnFirstRender Skips the onChange callback on an the initial image load.
 * @property {number} numberOfColors Amount of colors to extract.
 * @property {string} onChange Callback when colors are extracted.
 * @property {Function} src The source of the image to extract colors from.
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
 * @param {UseColorExtractProps} props Hook props
 * @return {string|Array<string>} Color (or collection of colors) extracted from the image.
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

		const imageNode = document.createElement( 'img' );
		const isGetPalette = numberOfColors !== 1;
		imageNode.crossOrigin = 'Anonymous';

		imageNode.onload = () => {
			try {
				const extractor = new ColorThief();
				const extractedData = isGetPalette
					? extractor.getPalette( imageNode, numberOfColors )
					: extractor.getColor( imageNode );

				let data;
				let changeValue;

				if ( isGetPalette ) {
					data = extractedData.map( ( values ) => {
						return tinycolor( {
							r: values[ 0 ],
							g: values[ 1 ],
							b: values[ 2 ],
						} );
					} );
					changeValue = data.map( ( color ) => color.toHexString() );
				} else {
					const [ r, g, b ] = extractedData;
					data = tinycolor( { r, g, b } );
					changeValue = data.toHexString();
				}

				onChange( changeValue, { data, node: imageNode } );
				setColors( changeValue );
				srcRef.current = src;
			} catch ( err ) {
				// eslint-disable-next-line no-console
				console.warn( err );
			}
		};

		// Load the image
		imageNode.src = src;
	}, [ src, initialColor, numberOfColors ] );

	return colors;
}
