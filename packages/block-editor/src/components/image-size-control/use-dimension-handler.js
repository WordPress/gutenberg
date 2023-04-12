/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

export default function useDimensionHandler(
	customHeight,
	customWidth,
	defaultHeight,
	defaultWidth,
	onChange
) {
	const [ currentWidth, setCurrentWidth ] = useState(
		customWidth ?? defaultWidth ?? ''
	);
	const [ currentHeight, setCurrentHeight ] = useState(
		customHeight ?? defaultHeight ?? ''
	);

	// When an image is first inserted, the default dimensions are initially
	// undefined. This effect updates the dimensions when the default values
	// come through.
	useEffect( () => {
		if ( customWidth === undefined && defaultWidth !== undefined ) {
			setCurrentWidth( defaultWidth );
		}
		if ( customHeight === undefined && defaultHeight !== undefined ) {
			setCurrentHeight( defaultHeight );
		}
	}, [ defaultWidth, defaultHeight ] );

	// If custom values change, it means an outsider has resized the image using some other method (eg resize box)
	// this keeps track of these values too. We need to parse before comparing; custom values can be strings.
	useEffect( () => {
		if (
			customWidth !== undefined &&
			Number.parseInt( customWidth ) !== Number.parseInt( currentWidth )
		) {
			setCurrentWidth( customWidth );
		}
		if (
			customHeight !== undefined &&
			Number.parseInt( customHeight ) !== Number.parseInt( currentHeight )
		) {
			setCurrentHeight( customHeight );
		}
	}, [ customWidth, customHeight ] );

	const updateDimension = ( dimension, value ) => {
		const parsedValue = value === '' ? undefined : parseInt( value, 10 );
		if ( dimension === 'width' ) {
			setCurrentWidth( parsedValue );
		} else {
			setCurrentHeight( parsedValue );
		}
		onChange( {
			[ dimension ]: parsedValue,
		} );
	};

	const updateDimensions = ( nextHeight, nextWidth ) => {
		setCurrentHeight( nextHeight ?? defaultHeight );
		setCurrentWidth( nextWidth ?? defaultWidth );
		onChange( { height: nextHeight, width: nextWidth } );
	};

	return {
		currentHeight,
		currentWidth,
		updateDimension,
		updateDimensions,
	};
}
