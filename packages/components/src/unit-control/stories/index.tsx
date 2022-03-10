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
import { UnitControl } from '../';
import { CSS_UNITS } from '../utils';

const meta: ComponentMeta< typeof UnitControl > = {
	component: UnitControl,
	title: 'Components (Experimental)/UnitControl',
	argTypes: {
		size: {
			control: { type: 'select' },
		},
		onChange: {
			control: { type: null },
		},
		onUnitChange: {
			control: { type: null },
		},
		value: {
			control: { type: null },
		},
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const DefaultTemplate: ComponentStory< typeof UnitControl > = ( {
	onChange,
	...args
} ) => {
	const [ value, setValue ] = useState< string | undefined >( '10px' );

	return (
		<div style={ { maxWidth: '100px' } }>
			<UnitControl
				{ ...args }
				value={ value }
				onChange={ ( v, extra ) => {
					setValue( v );
					onChange?.( v, extra );
				} }
			/>
		</div>
	);
};

export const Default: ComponentStory<
	typeof UnitControl
> = DefaultTemplate.bind( {} );
Default.args = {
	label: 'Label',
};

/**
 * If the `isPressEnterToChange` prop is set to `true`, the `onChange` callback
 * will not fire while a new value is typed in the input field (you can verify this
 * behavior by inspecting the console's output).
 */
export const PressEnterToChange: ComponentStory<
	typeof UnitControl
> = DefaultTemplate.bind( {} );
PressEnterToChange.args = {
	...Default.args,
	isPressEnterToChange: true,
	onChange: ( v ) => {
		// eslint-disable-next-line no-console
		console.log( v );
	},
};

/**
 * Most of `NumberControl`'s props can be passed to `UnitControl`, and they will
 * affect its numeric input field.
 */
export const TweakingTheNumberInput: ComponentStory<
	typeof UnitControl
> = DefaultTemplate.bind( {} );
TweakingTheNumberInput.args = {
	...Default.args,
	min: 0,
	max: 100,
	step: 'any',
	label: 'Custom label',
};

/**
 * When only one unit is available, the unit selection dropdown becomes static text.
 */
export const WithSingleUnit: ComponentStory<
	typeof UnitControl
> = DefaultTemplate.bind( {} );
WithSingleUnit.args = {
	...Default.args,
	units: CSS_UNITS.slice( 0, 1 ),
};

/**
 * It is possible to pass a custom list of units. Every time the unit changes,
 * if the `isResetValueOnUnitChange` is set to `true`, the input's quantity is
 * reset to the new unit's default value.
 */
export const WithCustomUnits: ComponentStory< typeof UnitControl > = ( {
	onChange,
	...args
} ) => {
	const [ value, setValue ] = useState< string | undefined >( '80km' );

	return (
		<div style={ { maxWidth: '100px' } }>
			<UnitControl
				{ ...args }
				value={ value }
				onChange={ ( v, extra ) => {
					setValue( v );
					onChange?.( v, extra );
				} }
			/>
		</div>
	);
};
WithCustomUnits.args = {
	...Default.args,
	isResetValueOnUnitChange: true,
	min: 0,
	units: [
		{
			value: 'km',
			label: 'km',
			default: 1,
		},
		{
			value: 'mi',
			label: 'mi',
			default: 1,
		},
		{
			value: 'm',
			label: 'm',
			default: 1000,
		},
		{
			value: 'yd',
			label: 'yd',
			default: 1760,
		},
	],
};
