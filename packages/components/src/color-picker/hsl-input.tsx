/**
 * External dependencies
 */
import { colord } from 'colord';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { InputWithSlider } from './input-with-slider';
import type { HslInputProps } from './types';

export const HslInput = ( { color, onChange, enableAlpha }: HslInputProps ) => {
	const colorPropHSL = color.toHsl();

	const [ internalHSLA, setInternalHSLA ] = useState( { ...colorPropHSL } );

	const isInternalColorSameAsReceivedColor = color.isEqual(
		colord( internalHSLA )
	);

	useEffect( () => {
		if ( ! isInternalColorSameAsReceivedColor ) {
			// Keep internal HSLA color up to date with the received color prop
			setInternalHSLA( colorPropHSL );
		}
	}, [ colorPropHSL, isInternalColorSameAsReceivedColor ] );

	// If the internal color is equal to the received color prop, we can use the
	// HSLA values from the local state which, compared to the received color prop,
	// retain more details about the actual H and S values that the user selected,
	// and thus allow for better UX when interacting with the H and S sliders.
	const colorValue = isInternalColorSameAsReceivedColor
		? internalHSLA
		: colorPropHSL;

	const updateHSLAValue = (
		partialNewValue: Partial< typeof colorPropHSL >
	) => {
		// Update internal HSLA color.
		setInternalHSLA( ( prevValue ) => ( {
			...prevValue,
			...partialNewValue,
		} ) );

		const nextOnChangeValue = colord( {
			...colorValue,
			...partialNewValue,
		} );

		// Fire `onChange` only if the resulting color is different from the
		// current one.
		if ( ! color.isEqual( nextOnChangeValue ) ) {
			onChange( nextOnChangeValue );
		}
	};

	return (
		<>
			<InputWithSlider
				min={ 0 }
				max={ 359 }
				label="Hue"
				abbreviation="H"
				value={ colorValue.h }
				onChange={ ( nextH: number ) => {
					updateHSLAValue( { h: nextH } );
				} }
			/>
			<InputWithSlider
				min={ 0 }
				max={ 100 }
				label="Saturation"
				abbreviation="S"
				value={ colorValue.s }
				onChange={ ( nextS: number ) => {
					updateHSLAValue( { s: nextS } );
				} }
			/>
			<InputWithSlider
				min={ 0 }
				max={ 100 }
				label="Lightness"
				abbreviation="L"
				value={ colorValue.l }
				onChange={ ( nextL: number ) => {
					updateHSLAValue( { l: nextL } );
				} }
			/>
			{ enableAlpha && (
				<InputWithSlider
					min={ 0 }
					max={ 100 }
					label="Alpha"
					abbreviation="A"
					value={ Math.trunc( 100 * colorValue.a ) }
					onChange={ ( nextA: number ) => {
						updateHSLAValue( { a: nextA / 100 } );
					} }
				/>
			) }
		</>
	);
};
