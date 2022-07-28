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
import { SliderControl } from '../';

const meta: ComponentMeta< typeof SliderControl > = {
	title: 'Components (Experimental)/SliderControl',
	component: SliderControl,
	argTypes: {
		errorColor: { control: { type: 'color' } },
		onBlur: { action: 'onBlur', control: { type: null } },
		onChange: { action: 'onChange' },
		onFocus: { action: 'onFocus', control: { type: null } },
		onMouseLeave: { action: 'onMouseLeave', control: { type: null } },
		onMouseMove: { action: 'onMouseMove', control: { type: null } },
		size: {
			control: 'radio',
			options: [ 'default', '__unstable-large' ],
		},
		step: { control: { type: 'number', min: 0.1, step: 0.1 } },
		thumbColor: { control: { type: 'color' } },
		trackBackgroundColor: { control: { type: 'color' } },
		trackColor: { control: { type: 'color' } },
		value: { control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof SliderControl > = ( {
	onChange,
	value: valueProp,
	...args
} ) => {
	const [ value, setValue ] = useState< number | undefined >( valueProp );
	const handleChange = ( newValue?: number ) => {
		setValue( newValue );
		onChange?.( newValue );
	};

	return (
		<SliderControl { ...args } value={ value } onChange={ handleChange } />
	);
};

export const Default: ComponentStory< typeof SliderControl > = Template.bind(
	{}
);
Default.args = {
	help: 'Please select how transparent you would like this.',
	label: 'Opacity',
	max: 100,
	min: 0,
	size: 'default',
};

/**
 * Setting the `step` prop to `"any"` will allow users to select non-integer
 * values. This also overrides the `showTooltip` props to `false`.
 */
export const WithAnyStep: ComponentStory< typeof SliderControl > = ( {
	onChange,
	...args
} ) => {
	const [ value, setValue ] = useState< number >();

	return (
		<>
			<SliderControl
				{ ...args }
				value={ value }
				onChange={ ( v ) => {
					setValue( v );
					onChange?.( v );
				} }
			/>
			<hr style={ { marginTop: '5em' } } />
			<p>Current value: { value }</p>
		</>
	);
};

WithAnyStep.parameters = { controls: { exclude: [ 'step' ] } };
WithAnyStep.args = {
	label: 'Brightness',
	step: 'any',
};

const MarkTemplate: ComponentStory< typeof SliderControl > = ( {
	label,
	onChange,
	...args
} ) => {
	const [ automaticValue, setAutomaticValue ] = useState< number >();
	const [ customValue, setCustomValue ] = useState< number >();

	return (
		<>
			<h2>{ label }</h2>
			<SliderControl
				{ ...args }
				label="Automatic marks"
				marks
				onChange={ ( v ) => {
					setAutomaticValue( v );
					onChange?.( v );
				} }
				value={ automaticValue }
			/>
			<SliderControl
				{ ...args }
				label="Custom marks"
				onChange={ ( v ) => {
					setCustomValue( v );
					onChange?.( v );
				} }
				value={ customValue }
			/>
		</>
	);
};

const marksBase = [
	{ value: 0, label: '0' },
	{ value: 1, label: '1' },
	{ value: 2, label: '2' },
	{ value: 8, label: '8' },
	{ value: 10, label: '10' },
];

const marksWithNegatives = [
	...marksBase,
	{ value: -1, label: '-1' },
	{ value: -2, label: '-2' },
	{ value: -4, label: '-4' },
	{ value: -8, label: '-8' },
];

/**
 * Use `marks` to render a visual representation of `step` ticks. Marks may be
 * automatically generated or custom mark indicators can be provided by an
 * `Array`.
 */
export const WithIntegerStepAndMarks: ComponentStory< typeof SliderControl > =
	MarkTemplate.bind( {} );

WithIntegerStepAndMarks.args = {
	label: 'Integer Step',
	marks: marksBase,
	max: 10,
	min: 0,
	step: 1,
};

/**
 * Decimal values may be used for `marks` rendered as a visual representation of
 * `step` ticks. Marks may be automatically generated or custom mark indicators
 * can be provided by an `Array`.
 */
export const WithDecimalStepAndMarks: ComponentStory< typeof SliderControl > =
	MarkTemplate.bind( {} );

WithDecimalStepAndMarks.args = {
	marks: [
		...marksBase,
		{ value: 3.5, label: '3.5' },
		{ value: 5.8, label: '5.8' },
	],
	max: 10,
	min: 0,
	step: 0.1,
};

/**
 * A negative `min` value can be used to constrain `SliderControl` values. Mark
 * indicators can represent negative values as well. Marks may be automatically
 * generated or custom mark indicators can be provided by an `Array`.
 */
export const WithNegativeMinimumAndMarks: ComponentStory<
	typeof SliderControl
> = MarkTemplate.bind( {} );

WithNegativeMinimumAndMarks.args = {
	marks: marksWithNegatives,
	max: 10,
	min: -10,
	step: 1,
};

/**
 * The entire range of valid values for a `SliderControl` may be negative. Mark
 * indicators can represent negative values as well. Marks may be automatically
 * generated or custom mark indicators can be provided by an `Array`.
 */
export const WithNegativeRangeAndMarks: ComponentStory< typeof SliderControl > =
	MarkTemplate.bind( {} );

WithNegativeRangeAndMarks.args = {
	marks: marksWithNegatives,
	max: -1,
	min: -10,
	step: 1,
};

/**
 * When a `SliderControl` has a `step` value of `any` a user may select
 * non-integer values. This may still be used in conjunction with `marks`
 * rendering a visual representation of `step` ticks.
 */
export const WithAnyStepAndMarks: ComponentStory< typeof SliderControl > =
	MarkTemplate.bind( {} );

WithAnyStepAndMarks.parameters = { controls: { exclude: [ 'step' ] } };
WithAnyStepAndMarks.args = {
	marks: marksBase,
	max: 10,
	min: 0,
	step: 'any',
};
