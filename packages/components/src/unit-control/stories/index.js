/**
 * External dependencies
 */
import { boolean, number, select, text, object } from '@storybook/addon-knobs';
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import UnitControl from '../';
import { CSS_UNITS } from '../utils';

export default {
	title: 'Components/UnitControl',
	component: UnitControl,
};

function Example() {
	const [ value, setValue ] = useState( '10px' );

	const props = {
		disableUnits: boolean( 'disableUnits', false ),
		hideLabelFromVision: boolean( 'hideLabelFromVision', false ),
		isPressEnterToChange: boolean( 'isPressEnterToChange', true ),
		isShiftStepEnabled: boolean( 'isShiftStepEnabled', true ),
		isUnitSelectTabbable: boolean( 'isUnitSelectTabbable', true ),
		label: text( 'label', 'Value' ),
		min: number( 'min', 0 ),
		max: number( 'max', 100 ),
		shiftStep: number( 'shiftStep', 10 ),
		size: select(
			'size',
			{
				default: 'default',
				small: 'small',
			},
			'default'
		),
		step: number( 'step', 1 ),
		units: object( 'units', CSS_UNITS ),
	};

	return (
		<ControlWrapperView>
			<UnitControl
				{ ...props }
				value={ value }
				onChange={ ( v ) => setValue( v ) }
			/>
		</ControlWrapperView>
	);
}

export const _default = () => {
	return <Example />;
};

const ControlWrapperView = styled.div`
	max-width: 80px;
`;
