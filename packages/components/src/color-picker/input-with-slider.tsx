/**
 * Internal dependencies
 */
import { HStack } from '../h-stack';
import { Text } from '../text';
import { Spacer } from '../spacer';
import { space } from '../ui/utils/space';
import { RangeControl, NumberControlWrapper } from './styles';
import { COLORS } from '../utils/colors-values';

interface InputWithSliderProps {
	min: number;
	max: number;
	value: number;
	label: string;
	abbreviation: string;
	onChange: ( value: number ) => void;
}

// TODO:
// - look for edge cases, make more robust
// - move to shared util
const ensureNumber = ( n: string | number ) =>
	typeof n === 'string' ? parseFloat( n ) : n;

const ensureString = ( s: string | number ) =>
	typeof s === 'string' ? s : `${ s }`;

export const InputWithSlider = ( {
	min,
	max,
	label,
	abbreviation,
	onChange,
	value,
}: InputWithSliderProps ) => {
	return (
		<Spacer as={ HStack } spacing={ 4 }>
			<NumberControlWrapper
				min={ min }
				max={ max }
				label={ label }
				hideLabelFromVision
				value={ ensureString( value ) }
				onChange={ ( nextValue?: string ) => {
					if ( typeof nextValue === 'undefined' ) {
						return;
					}

					onChange?.( ensureNumber( nextValue ) );
				} }
				prefix={
					<Spacer
						as={ Text }
						paddingLeft={ space( 3.5 ) }
						color={ COLORS.ui.theme }
						lineHeight={ 1 }
					>
						{ abbreviation }
					</Spacer>
				}
				hideHTMLArrows
			/>
			<RangeControl
				label={ label }
				hideLabelFromVision
				min={ min }
				max={ max }
				value={ value }
				onChange={ onChange }
				withInputField={ false }
			/>
		</Spacer>
	);
};
