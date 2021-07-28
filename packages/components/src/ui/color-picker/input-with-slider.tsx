/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import RangeControl from '../../range-control';
import NumberControl from '../../number-control';
import { HStack } from '../../h-stack';
import { Text } from '../../text';
import { Spacer } from '../../spacer';
import { space } from '../utils/space';
import { StyledField } from '../../base-control/styles/base-control-styles';

const StyledRangeControl = styled( RangeControl )`
	flex: 1;

	${ StyledField } {
		margin-bottom: 0;
	}
`;

const Wrapper = styled( HStack )`
	margin-bottom: ${ space( 2 ) };
`;

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
		<Wrapper>
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
			<StyledRangeControl
				label={ label }
				hideLabelFromVision
				min={ min }
				max={ max }
				value={ value }
				onChange={ onChange }
				withInputField={ false }
			/>
		</Wrapper>
	);
};
