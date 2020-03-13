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
	const [ value, setValue ] = useState( '' );
	const [ unit, setUnit ] = useState( 'px' );

	const props = {
		isShiftStepEnabled: boolean( 'isShiftStepEnabled', true ),
		isUnitSelectTabbable: boolean( 'isUnitSelectTabbable', true ),
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
	};

	return (
		<ControlWrapperView>
			<UnitControl
				{ ...props }
				value={ value }
				onChange={ setValue }
				unit={ unit }
				onUnitChange={ setUnit }
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
