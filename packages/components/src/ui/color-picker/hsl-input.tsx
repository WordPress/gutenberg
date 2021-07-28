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
	enableAlpha: boolean;
}

export const HslInput = ( { color, onChange, enableAlpha }: HslInputProps ) => {
	const { h, s, l, a } = colorize( color ).toHsl();

	return (
		<>
			<InputWithSlider
				min={ 1 }
				max={ 360 }
				label="Hue"
				abbreviation="H"
				value={ Math.trunc( h ) }
				onChange={ ( nextH: number ) =>
					onChange( colorize( { h: nextH, s, l, a } ).toHex8String() )
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
						colorize( { h, s: nextS / 100, l, a } ).toHex8String()
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
						colorize( { h, s, l: nextL / 100, a } ).toHex8String()
					)
				}
			/>
			{ enableAlpha && (
				<InputWithSlider
					min={ 0 }
					max={ 100 }
					label="Alpha"
					abbreviation="A"
					value={ Math.trunc( 100 * a ) }
					onChange={ ( nextA: number ) =>
						onChange(
							colorize( {
								h,
								s,
								l,
								a: nextA / 100,
							} ).toHex8String()
						)
					}
				/>
			) }
		</>
	);
};
