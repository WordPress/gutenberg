/**
 * Internal dependencies
 */
import NumberControl from '../../number-control';
import { HStack } from '../../h-stack';
import { Text } from '../../text';
import { Spacer } from '../../spacer';
import { space } from '../utils/space';
import { RangeControl } from './styles';

interface InputWithSliderProps {
	min: number;
	max: number;
	value: number;
	label: string;
	abbreviation: string;
	onChange: ( value: number ) => void;
}

export const InputWithSlider = ( {
	min,
	max,
	label,
	abbreviation,
	onChange,
	value,
}: InputWithSliderProps ) => {
	return (
		<Spacer as={ HStack }>
			<NumberControl
				__unstableInputWidth="5em"
				min={ min }
				max={ max }
				label={ label }
				hideLabelFromVision
				value={ value }
				onChange={ onChange }
				prefix={
					<Spacer as={ Text } paddingLeft={ space( 1 ) } color="blue">
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
