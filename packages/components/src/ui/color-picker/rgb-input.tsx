/**
 * External dependencies
 */
import colorize from 'tinycolor2';

/**
 * Internal dependencies
 */
import { InputWithSlider } from './input-with-slider';

interface RgbInputProps {
	color: string;
	onChange: ( color: string ) => void;
	enableAlpha: boolean;
}

export const RgbInput = ( { color, onChange, enableAlpha }: RgbInputProps ) => {
	const { r, g, b, a } = colorize( color ).toRgb();

	return (
		<>
			<InputWithSlider
				min={ 0 }
				max={ 255 }
				label="Red"
				abbreviation="R"
				value={ r }
				onChange={ ( nextR: number ) =>
					onChange( colorize( { r: nextR, g, b, a } ).toHex8String() )
				}
			/>
			<InputWithSlider
				min={ 0 }
				max={ 255 }
				label="Green"
				abbreviation="G"
				value={ g }
				onChange={ ( nextG: number ) =>
					onChange( colorize( { r, g: nextG, b, a } ).toHex8String() )
				}
			/>
			<InputWithSlider
				min={ 0 }
				max={ 255 }
				label="Blue"
				abbreviation="B"
				value={ b }
				onChange={ ( nextB: number ) =>
					onChange( colorize( { r, g, b: nextB, a } ).toHex8String() )
				}
			/>
			{ enableAlpha && (
				<InputWithSlider
					min={ 0 }
					max={ 100 }
					label="Alpha"
					abbreviation="A"
					value={ Math.trunc( a * 100 ) }
					onChange={ ( nextA: number ) =>
						onChange(
							colorize( {
								r,
								g,
								b,
								a: nextA / 100,
							} ).toHex8String()
						)
					}
				/>
			) }
		</>
	);
};
