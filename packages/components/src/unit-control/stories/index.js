/**
 * External dependencies
 */
import { boolean, number, select, text } from '@storybook/addon-knobs';
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import UnitControl from '../';

export default {
	title: 'Components/UnitControl',
	component: UnitControl,
};

function Example() {
	const [ value, setValue ] = useState( '10px' );

	const props = {
		disableUnits: boolean( 'disableUnits', false ),
		isShiftStepEnabled: boolean( 'isShiftStepEnabled', true ),
		isUnitSelectTabbable: boolean( 'isUnitSelectTabbable', true ),
		label: text( 'label', 'Value' ),
		shiftStep: number( 'shiftStep', 10 ),
		max: number( 'max', 100 ),
		min: number( 'min', 0 ),
		size: select(
			'size',
			{
				default: 'default',
				small: 'small',
			},
			'default'
		),
		step: number( 'step', 1 ),
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
