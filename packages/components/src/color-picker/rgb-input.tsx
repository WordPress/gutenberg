/**
 * External dependencies
 */
import { colord } from 'colord';

/**
 * Internal dependencies
 */
import { InputWithSlider } from './input-with-slider';
import type { RgbInputProps } from './types';

export const RgbInput = ( { color, onChange, enableAlpha }: RgbInputProps ) => {
	const { r, g, b, a } = color.toRgb();

	return (
		<>
			<InputWithSlider
				min={ 0 }
				max={ 255 }
				label="Red"
				abbreviation="R"
				value={ r }
				onChange={ ( nextR: number ) =>
					onChange( colord( { r: nextR, g, b, a } ) )
				}
			/>
			<InputWithSlider
				min={ 0 }
				max={ 255 }
				label="Green"
				abbreviation="G"
				value={ g }
				onChange={ ( nextG: number ) =>
					onChange( colord( { r, g: nextG, b, a } ) )
				}
			/>
			<InputWithSlider
				min={ 0 }
				max={ 255 }
				label="Blue"
				abbreviation="B"
				value={ b }
				onChange={ ( nextB: number ) =>
					onChange( colord( { r, g, b: nextB, a } ) )
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
							colord( {
								r,
								g,
								b,
								a: nextA / 100,
							} )
						)
					}
				/>
			) }
		</>
	);
};
