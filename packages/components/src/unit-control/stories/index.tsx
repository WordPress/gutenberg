/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import UnitControl from '../';
import { CSS_UNITS } from '../utils';

const meta: ComponentMeta< typeof UnitControl > = {
	component: UnitControl,
	title: 'Components (Experimental)/UnitControl',
	argTypes: {
		disableUnits: { control: { type: 'boolean' } },
		size: {
      options: ['default', 'small', '__unstable-large'],
			control: { type: 'select' }
    },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const DefaultTemplate: ComponentStory< typeof UnitControl > = ( args ) => {
	const [ value, setValue ] = useState<string | undefined>( '10px' );

	return (
		<div style={{maxWidth: '80px'}}>
			<UnitControl
				{ ...args }
				value={ value }
				onChange={ ( v ) => setValue( v ) }
			/>
		</div>
	);
};

export const Default: ComponentStory<
	typeof UnitControl
> = DefaultTemplate.bind({});
Default.args = {
	disableUnits: false,
	hideLabelFromVision: false,
	isPressEnterToChange: true,
	isResetValueOnUnitChange: false,
	isShiftStepEnabled: true,
	isUnitSelectTabbable: true,
	label: 'Value',
	min: 0,
	max: 100,
	shiftStep: 10,
	size: 'default',
	step: 1,
	units: CSS_UNITS,
	onUnitChange: () => {},
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
