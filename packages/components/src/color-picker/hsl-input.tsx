/**
 * External dependencies
 */
import type { HslaColor } from 'react-colorful';

/**
 * Internal dependencies
 */
import { InputWithSlider } from './input-with-slider';
import type { HslInputProps } from './types';

export const HslInput = ( { hsla, onChange, enableAlpha }: HslInputProps ) => {
	const updateHSLAValue = ( partialNewValue: Partial< HslaColor > ) => {
		onChange( {
			...hsla,
			...partialNewValue,
		} );
	};

	return (
		<>
			<InputWithSlider
				min={ 0 }
				max={ 359 }
				label="Hue"
				abbreviation="H"
				value={ hsla.h }
				onChange={ ( nextH: number ) => {
					updateHSLAValue( { h: nextH } );
				} }
			/>
			<InputWithSlider
				min={ 0 }
				max={ 100 }
				label="Saturation"
				abbreviation="S"
				value={ hsla.s }
				onChange={ ( nextS: number ) => {
					updateHSLAValue( { s: nextS } );
				} }
			/>
			<InputWithSlider
				min={ 0 }
				max={ 100 }
				label="Lightness"
				abbreviation="L"
				value={ hsla.l }
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
					value={ Math.trunc( 100 * hsla.a ) }
					onChange={ ( nextA: number ) => {
						updateHSLAValue( { a: nextA / 100 } );
					} }
				/>
			) }
		</>
	);
};
