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
			setInternalHSLA( colorPropHSL );
		}
	}, [ colorPropHSL, isInternalColorSameAsReceivedColor ] );

	const colorValue = isInternalColorSameAsReceivedColor
		? internalHSLA
		: colorPropHSL;

	const updateHSLAValue = (
		partialNewValue: Partial< typeof colorPropHSL >
	) => {
		setInternalHSLA( ( prevValue ) => ( {
			...prevValue,
			...partialNewValue,
		} ) );

		const nextOnChangeValue = colord( {
			...colorValue,
			...partialNewValue,
		} );

		// Avoid firing `onChange` if the resulting didn't change.
		if ( color.isEqual( nextOnChangeValue ) ) {
			return;
		}

		onChange(
			colord( {
				...colorValue,
				...partialNewValue,
			} )
		);
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
