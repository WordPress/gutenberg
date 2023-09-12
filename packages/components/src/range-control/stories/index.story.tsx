/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { starEmpty, starFilled, styles, wordpress } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import RangeControl from '..';

const ICONS = { starEmpty, starFilled, styles, wordpress };

const meta: Meta< typeof RangeControl > = {
	component: RangeControl,
	title: 'Components/RangeControl',
	argTypes: {
		afterIcon: {
			control: { type: 'select' },
			options: Object.keys( ICONS ),
			mapping: ICONS,
		},
		beforeIcon: {
			control: { type: 'select' },
			options: Object.keys( ICONS ),
			mapping: ICONS,
		},
		color: { control: { type: 'color' } },
		help: { control: { type: 'text' } },
		icon: { control: { type: null } },
		marks: { control: { type: 'object' } },
		onBlur: { control: { type: null } },
		onChange: { control: { type: null } },
		onFocus: { control: { type: null } },
		onMouseLeave: { control: { type: null } },
		onMouseMove: { control: { type: null } },
		railColor: { control: { type: 'color' } },
		step: { control: { type: 'number' } },
		trackColor: { control: { type: 'color' } },
		type: { control: { type: 'check' }, options: [ 'stepper' ] },
		value: { control: { type: null } },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof RangeControl > = ( { onChange, ...args } ) => {
	const [ value, setValue ] = useState< number >();

	return (
		<RangeControl
			{ ...args }
			value={ value }
			onChange={ ( v ) => {
				setValue( v );
				onChange?.( v );
			} }
		/>
	);
};

export const Default: StoryFn< typeof RangeControl > = Template.bind( {} );
Default.args = {
	help: 'Please select how transparent you would like this.',
	initialPosition: 50,
	label: 'Opacity',
	max: 100,
	min: 0,
};

/**
 * Setting the `step` prop to `"any"` will allow users to select non-integer
 * values. This also overrides both `withInputField` and `showTooltip` props to
 * `false`.
 */
export const WithAnyStep: StoryFn< typeof RangeControl > = ( {
	onChange,
	...args
} ) => {
	const [ value, setValue ] = useState< number >();

	return (
		<>
			<RangeControl
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
WithAnyStep.args = {
	label: 'Brightness',
	step: 'any',
};

const MarkTemplate: StoryFn< typeof RangeControl > = ( {
	label,
	onChange,
	...args
} ) => {
	const [ automaticValue, setAutomaticValue ] = useState< number >();
	const [ customValue, setCustomValue ] = useState< number >();

	return (
		<>
			<h2>{ label }</h2>
			<RangeControl
				{ ...args }
				label="Automatic marks"
				marks
				onChange={ ( v ) => {
					setAutomaticValue( v );
					onChange?.( v );
				} }
				value={ automaticValue }
			/>
			<RangeControl
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
export const WithIntegerStepAndMarks: StoryFn< typeof RangeControl > =
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
export const WithDecimalStepAndMarks: StoryFn< typeof RangeControl > =
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
 * A negative `min` value can be used to constrain `RangeControl` values. Mark
 * indicators can represent negative values as well. Marks may be automatically
 * generated or custom mark indicators can be provided by an `Array`.
 */
export const WithNegativeMinimumAndMarks: StoryFn< typeof RangeControl > =
	MarkTemplate.bind( {} );

WithNegativeMinimumAndMarks.args = {
	marks: marksWithNegatives,
	max: 10,
	min: -10,
	step: 1,
};

/**
 * The entire range of valid values for a `RangeControl` may be negative. Mark
 * indicators can represent negative values as well. Marks may be automatically
 * generated or custom mark indicators can be provided by an `Array`.
 */
export const WithNegativeRangeAndMarks: StoryFn< typeof RangeControl > =
	MarkTemplate.bind( {} );

WithNegativeRangeAndMarks.args = {
	marks: marksWithNegatives,
	max: -1,
	min: -10,
	step: 1,
};

/**
 * When a `RangeControl` has a `step` value of `any` a user may select
 * non-integer values. This may still be used in conjunction with `marks`
 * rendering a visual representation of `step` ticks.
 */
export const WithAnyStepAndMarks: StoryFn< typeof RangeControl > =
	MarkTemplate.bind( {} );

WithAnyStepAndMarks.args = {
	marks: marksBase,
	max: 10,
	min: 0,
	step: 'any',
};
