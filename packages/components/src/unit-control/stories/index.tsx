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
	title: 'Components (Experimental)/UnitControl',
	component: UnitControl,
	parameters: {
		knobs: { disable: false },
	},
};

const ControlWrapperView = styled.div`
	max-width: 80px;
`;

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
				'__unstable-large': '__unstable-large',
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

// export const WithSingleUnit = ( props ) => {
// 	const [ value, setValue ] = useState( '10px' );
// 	return (
// 		<ControlWrapperView>
// 			<UnitControl
// 				{ ...props }
// 				value={ value }
// 				onChange={ ( v ) => setValue( v ) }
// 			/>
// 		</ControlWrapperView>
// 	);
// };
// WithSingleUnit.args = {
// 	label: 'Value',
// 	units: CSS_UNITS.slice( 0, 1 ),
// };

// export function WithCustomUnits() {
// 	const [ value, setValue ] = useState( '10km' );

// 	const props = {
// 		isResetValueOnUnitChange: boolean( 'isResetValueOnUnitChange', true ),
// 		label: text( 'label', 'Distance' ),
// 		units: object( 'units', [
// 			{
// 				value: 'km',
// 				label: 'km',
// 				default: 1,
// 			},
// 			{
// 				value: 'mi',
// 				label: 'mi',
// 				default: 1,
// 			},
// 			{
// 				value: 'm',
// 				label: 'm',
// 				default: 1000,
// 			},
// 			{
// 				value: 'yd',
// 				label: 'yd',
// 				default: 1760,
// 			},
// 		] ),
// 	};

// 	return (
// 		<ControlWrapperView>
// 			<UnitControl
// 				{ ...props }
// 				value={ value }
// 				onChange={ ( v ) => setValue( v ) }
// 			/>
// 		</ControlWrapperView>
// 	);
// }
