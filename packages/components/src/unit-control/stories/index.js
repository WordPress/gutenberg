/**
 * External dependencies
 */
import { boolean, number, select } from '@storybook/addon-knobs';
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
	const [ value, setValue ] = useState( '10' );
	const [ unit, setUnit ] = useState( 'px' );

	const props = {
		isShiftStepEnabled: boolean( 'isShiftStepEnabled', true ),
		isUnitSelectTabbable: boolean( 'isUnitSelectTabbable', true ),
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
				unit={ unit }
				onUnitChange={ ( v ) => setUnit( v ) }
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
