/**
 * External dependencies
 */
import { noop } from 'lodash';
import tinycolor from 'tinycolor2';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

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
	disableChangeOnFirstRender = false,
	numberOfColors = 1,
	onChange = noop,
	src,
} ) {
	const [ colors, setColors ] = useState();
	const [ didInitialLoad, setDidInitialLoad ] = useState(
		! disableChangeOnFirstRender
	);

	useEffect( () => {
		if ( ! src ) return;

		if ( ! didInitialLoad ) {
			setDidInitialLoad( true );
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
			} catch ( err ) {
				// eslint-disable-next-line no-console
				console.warn( err );
			}
		};

		// Load the image
		imageNode.src = src;
	}, [ src, numberOfColors ] );

	return colors;
}
