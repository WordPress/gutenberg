import { colord } from 'colord';
import { __, _x } from '@wordpress/i18n';
import { InputWithSlider } from './input-with-slider';
import type { RgbInputProps } from './types';

export const RgbInput = ( { color, onChange, enableAlpha }: RgbInputProps ) => {
	const { r, g, b, a } = color.toRgb();

	return (
		<>
			<InputWithSlider
				min={ 0 }
				max={ 255 }
				label={ __( 'Red' ) }
				abbreviation={ _x( 'R', 'red color channel abbreviation' ) }
				value={ r }
				onChange={ ( nextR: number ) =>
					onChange( colord( { r: nextR, g, b, a } ) )
				}
			/>
			<InputWithSlider
				min={ 0 }
				max={ 255 }
				label={ __( 'Green' ) }
				abbreviation={ _x( 'G', 'green color channel abbreviation' ) }
				value={ g }
				onChange={ ( nextG: number ) =>
					onChange( colord( { r, g: nextG, b, a } ) )
				}
			/>
			<InputWithSlider
				min={ 0 }
				max={ 255 }
				label={ __( 'Blue' ) }
				abbreviation={ _x( 'B', 'blue color channel abbreviation' ) }
				value={ b }
				onChange={ ( nextB: number ) =>
					onChange( colord( { r, g, b: nextB, a } ) )
				}
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
