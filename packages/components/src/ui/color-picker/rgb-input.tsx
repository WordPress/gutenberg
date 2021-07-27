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
}

export const RgbInput = ( { color, onChange }: RgbInputProps ) => {
	const { r, g, b } = colorize( color ).toRgb();

	return (
		<>
			<InputWithSlider
				min={ 0 }
				max={ 255 }
				label="Red"
				abbreviation="R"
				value={ r }
				onChange={ ( nextR: number ) =>
					onChange( colorize( { r: nextR, g, b } ).toHex8String() )
				}
			/>
			<InputWithSlider
				min={ 0 }
				max={ 255 }
				label="Green"
				abbreviation="G"
				value={ g }
				onChange={ ( nextG: number ) =>
					onChange( colorize( { r, g: nextG, b } ).toHex8String() )
				}
			/>
			<InputWithSlider
				min={ 0 }
				max={ 255 }
				label="Blue"
				abbreviation="B"
				value={ b }
				onChange={ ( nextB: number ) =>
					onChange( colorize( { r, g, b: nextB } ).toHex8String() )
				}
			/>
		</>
	);
};
