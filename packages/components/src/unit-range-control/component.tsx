/**
 * Internal dependencies
 */
import UnitControl from '../unit-control';
import RangeControl from '../range-control';
import { HStack } from '../h-stack';
import { StyledLabel } from '../base-control/styles/base-control-styles';
import { View } from '../view';
import { VisuallyHidden } from '../visually-hidden';
import { contextConnect, WordPressComponentProps } from '../ui/context';
import { useUnitRangeControl } from './hook';

import type { UnitRangeControlProps, LabelProps } from './types';

const UnitRangeLabel = ( props: LabelProps ) => {
	const { label, hideLabelFromVision } = props;

	if ( ! label ) {
		return null;
	}

	return hideLabelFromVision ? (
		<VisuallyHidden as="label">{ label }</VisuallyHidden>
	) : (
		<StyledLabel>{ label }</StyledLabel>
	);
};

const UnitRangeControl = (
	props: WordPressComponentProps< UnitRangeControlProps, 'div' >,
	forwardedRef: React.ForwardedRef< any >
) => {
	const {
		hideLabelFromVision,
		label,
		unitControlProps,
		rangeControlProps,
		...otherProps
	} = useUnitRangeControl( props );

	return (
		<View { ...otherProps } ref={ forwardedRef }>
			<UnitRangeLabel
				label={ label }
				hideLabelFromVision={ hideLabelFromVision }
			/>
			<HStack spacing={ 3 }>
				<UnitControl { ...unitControlProps } />
				<RangeControl { ...rangeControlProps } />
			</HStack>
		</View>
	);
};

const ConnectedUnitRangeControl = contextConnect(
	UnitRangeControl,
	'UnitRangeControl'
);

export default ConnectedUnitRangeControl;
