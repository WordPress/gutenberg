/**
 * External dependencies
 */
import colorize from 'tinycolor2';

/**
 * Internal dependencies
 */
import { InputWithSlider } from './input-with-slider';

interface HslInputProps {
	color: string;
	onChange: ( color: string ) => void;
}

export const HslInput = ( { color, onChange }: HslInputProps ) => {
	const { h, s, l } = colorize( color ).toHsl();

	return (
		<>
			<InputWithSlider
				min={ 1 }
				max={ 360 }
				label="Hue"
				abbreviation="H"
				value={ Math.trunc( h ) }
				onChange={ ( nextH: number ) =>
					onChange( colorize( { h: nextH, s, l } ).toHex8String() )
				}
			/>
			<InputWithSlider
				min={ 0 }
				max={ 100 }
				label="Saturation"
				abbreviation="S"
				value={ Math.trunc( 100 * s ) }
				onChange={ ( nextS: number ) =>
					onChange(
						colorize( { h, s: nextS / 100, l } ).toHex8String()
					)
				}
			/>
			<InputWithSlider
				min={ 0 }
				max={ 100 }
				label="Lightness"
				abbreviation="L"
				value={ Math.trunc( 100 * l ) }
				onChange={ ( nextL: number ) =>
					onChange(
						colorize( { h, s, l: nextL / 100 } ).toHex8String()
					)
				}
			/>
		</>
	);
};
