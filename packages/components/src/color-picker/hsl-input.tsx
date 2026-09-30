import { __, _x } from '@wordpress/i18n';
import type { HslaColor } from 'react-colorful';
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
				label={ __( 'Hue' ) }
				abbreviation={ _x( 'H', 'hue color channel abbreviation' ) }
				value={ hsla.h }
				onChange={ ( nextH: number ) => {
					updateHSLAValue( { h: nextH } );
				} }
			/>
			<InputWithSlider
				min={ 0 }
				max={ 100 }
				label={ __( 'Saturation' ) }
				abbreviation={ _x(
					'S',
					'saturation color channel abbreviation'
				) }
				value={ hsla.s }
				onChange={ ( nextS: number ) => {
					updateHSLAValue( { s: nextS } );
				} }
			/>
			<InputWithSlider
				min={ 0 }
				max={ 100 }
				label={ __( 'Lightness' ) }
				abbreviation={ _x(
					'L',
					'lightness color channel abbreviation'
				) }
				value={ hsla.l }
				onChange={ ( nextL: number ) => {
					updateHSLAValue( { l: nextL } );
				} }
			/>
			{ enableAlpha && (
				<InputWithSlider
					min={ 0 }
					max={ 100 }
					label={ __( 'Alpha' ) }
					abbreviation={ _x(
						'A',
						'alpha color channel abbreviation'
					) }
					value={ Math.trunc( 100 * hsla.a ) }
					onChange={ ( nextA: number ) => {
						updateHSLAValue( { a: nextA / 100 } );
					} }
				/>
			) }
		</>
	);
};
