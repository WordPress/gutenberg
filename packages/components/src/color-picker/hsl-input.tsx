/**
 * External dependencies
 */
import { colord, Colord } from 'colord';

/**
 * Internal dependencies
 */
import { InputWithSlider } from './input-with-slider';

interface HslInputProps {
	color: Colord;
	onChange: ( nextColor: Colord ) => void;
	enableAlpha: boolean;
}

export const HslInput = ( { color, onChange, enableAlpha }: HslInputProps ) => {
	const { h, s, l, a } = color.toHsl();

	return (
		<>
			<InputWithSlider
				min={ 0 }
				max={ 359 }
				label="Hue"
				abbreviation="H"
				value={ h }
				onChange={ ( nextH: number ) => {
					onChange( colord( { h: nextH, s, l, a } ) );
				} }
			/>
			<InputWithSlider
				min={ 0 }
				max={ 100 }
				label="Saturation"
				abbreviation="S"
				value={ s }
				onChange={ ( nextS: number ) => {
					onChange(
						colord( {
							h,
							s: nextS,
							l,
							a,
						} )
					);
				} }
			/>
			<InputWithSlider
				min={ 0 }
				max={ 100 }
				label="Lightness"
				abbreviation="L"
				value={ l }
				onChange={ ( nextL: number ) => {
					onChange(
						colord( {
							h,
							s,
							l: nextL,
							a,
						} )
					);
				} }
			/>
			{ enableAlpha && (
				<InputWithSlider
					min={ 0 }
					max={ 100 }
					label="Alpha"
					abbreviation="A"
					value={ Math.trunc( 100 * a ) }
					onChange={ ( nextA: number ) => {
						onChange(
							colord( {
								h,
								s,
								l,
								a: nextA / 100,
							} )
						);
					} }
				/>
			) }
		</>
	);
};
