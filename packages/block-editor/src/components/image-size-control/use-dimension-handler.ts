import { useEffect, useState } from '@wordpress/element';
import type { ImageDimensions } from './types';

export default function useDimensionHandler(
	customHeight: number | string | null | undefined,
	customWidth: number | string | null | undefined,
	defaultHeight: number | string | undefined,
	defaultWidth: number | string | undefined,
	onChange: ( dimensions: ImageDimensions ) => void
) {
	const [ currentWidth, setCurrentWidth ] = useState<
		number | string | null | undefined
	>( customWidth ?? defaultWidth ?? '' );
	const [ currentHeight, setCurrentHeight ] = useState<
		number | string | null | undefined
	>( customHeight ?? defaultHeight ?? '' );

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
			// `parseInt` reads a number as its string form.
			Number.parseInt( customWidth as string ) !==
				Number.parseInt( currentWidth as string )
		) {
			setCurrentWidth( customWidth );
		}
		if (
			customHeight !== undefined &&
			Number.parseInt( customHeight as string ) !==
				Number.parseInt( currentHeight as string )
		) {
			setCurrentHeight( customHeight );
		}
	}, [ customWidth, customHeight ] );

	const updateDimension = (
		dimension: keyof ImageDimensions,
		value?: string
	) => {
		const parsedValue =
			// An unset value parses as `NaN`, as before.
			value === '' ? undefined : parseInt( value as string, 10 );
		if ( dimension === 'width' ) {
			setCurrentWidth( parsedValue );
		} else {
			setCurrentHeight( parsedValue );
		}
		onChange( {
			[ dimension ]: parsedValue,
		} );
	};

	const updateDimensions = ( nextHeight?: number, nextWidth?: number ) => {
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
