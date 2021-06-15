/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

export default function useDimensionHander(
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

	function updateDimension( dimension, value ) {
		if ( dimension === 'width' ) {
			setCurrentWidth( value );
		} else {
			setCurrentHeight( value );
		}
		onChange( {
			[ dimension ]: value === '' ? undefined : parseInt( value, 10 ),
		} );
	}

	return {
		currentHeight,
		currentWidth,
		updateDimension,
	};
}
