/**
 * External dependencies
 */
import type { ColorFormats } from 'tinycolor2';

/**
 * Internal dependencies
 */
import { InputWithSlider } from './input-with-slider';

interface HslInputProps {
	color: ColorFormats.HSLA;
	onChange: ( color: ColorFormats.HSLA ) => void;
	enableAlpha: boolean;
}

export const HslInput = ( { color, onChange, enableAlpha }: HslInputProps ) => {
	const { h, s, l, a } = color;

	return (
		<>
			<InputWithSlider
				min={ 1 }
				max={ 360 }
				label="Hue"
				abbreviation="H"
				value={ Math.trunc( h ) }
				onChange={ ( nextH: number ) =>
					onChange( { h: nextH, s, l, a } )
				}
			/>
			<InputWithSlider
				min={ 0 }
				max={ 100 }
				label="Saturation"
				abbreviation="S"
				value={ s <= 1 ? Math.trunc( 100 * s ) : s }
				onChange={ ( nextS: number ) =>
					onChange( { h, s: nextS / 100, l, a } )
				}
			/>
			<InputWithSlider
				min={ 0 }
				max={ 100 }
				label="Lightness"
				abbreviation="L"
				value={ l <= 1 ? Math.trunc( 100 * l ) : l }
				onChange={ ( nextL: number ) =>
					onChange( { h, s, l: nextL / 100, a } )
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
						onChange( {
							h,
							s,
							l,
							a: nextA / 100,
						} )
					}
				/>
			) }
		</>
	);
};
