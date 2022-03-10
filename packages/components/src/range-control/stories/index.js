/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { styles, wordpress } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import RangeControl from '../index';

const ICONS = { styles, wordpress };

export default {
	title: 'Components/RangeControl',
	component: RangeControl,
	argTypes: {
		afterIcon: {
			control: { type: 'select' },
			options: Object.keys( ICONS ),
			mapping: ICONS,
		},
		allowReset: { control: { type: 'boolean' } },
		beforeIcon: {
			control: { type: 'select' },
			options: Object.keys( ICONS ),
			mapping: ICONS,
		},
		color: { control: { type: 'color' } },
		disabled: { control: { type: 'boolean' } },
		help: { control: { type: 'text' } },
		marks: { control: { type: 'object' } },
		min: { control: { type: 'number' } },
		max: { control: { type: 'number' } },
		railColor: { control: { type: 'color' } },
		showTooltip: { control: { type: 'boolean' } },
		step: { control: { type: 'number' } },
		trackColor: { control: { type: 'color' } },
		withInputField: { control: { type: 'boolean' } },
	},
	parameters: {
		docs: { source: { state: 'open' } },
	},
};

const RangeControlWithState = ( { initialValue, ...props } ) => {
	const [ value, setValue ] = useState( initialValue );

	return <RangeControl { ...props } value={ value } onChange={ setValue } />;
};

export const Default = RangeControlWithState.bind( {} );
Default.args = {
	label: 'Range label',
};

/**
 * The `initialPosition` prop sets the starting position of the slider when no `value` is provided.
 */
export const InitialValueZero = RangeControlWithState.bind( {} );
InitialValueZero.args = {
	...Default.args,
	initialPosition: 0,
	max: 20,
};

/**
 * Setting the `step` prop to `"any"` will allow users to select non-integer values.
 * This also overrides both `withInputField` and `showTooltip` props to `false`.
 */
export const WithAnyStep = ( props ) => {
	const [ value, setValue ] = useState( 1.2345 );

	return (
		<>
			<RangeControl value={ value } onChange={ setValue } { ...props } />
			<p>Current value: { value }</p>
		</>
	);
};
WithAnyStep.args = {
	label: 'Brightness',
	step: 'any',
};

export const WithHelp = RangeControlWithState.bind( {} );
WithHelp.args = {
	...Default.args,
	label: 'How many columns should this use?',
	help: 'Please select the number of columns you would like this to contain.',
};

/**
 * Set `min` and `max` values to constrain the range of allowed values.
 */
export const WithMinimumAndMaximumLimits = RangeControlWithState.bind( {} );
WithMinimumAndMaximumLimits.args = {
	...Default.args,
	min: 2,
	max: 10,
};

export const WithIconBefore = RangeControlWithState.bind( {} );
WithIconBefore.args = {
	...Default.args,
	beforeIcon: wordpress,
};

export const WithIconAfter = RangeControlWithState.bind( {} );
WithIconAfter.args = {
	...Default.args,
	afterIcon: wordpress,
};

export const WithReset = RangeControlWithState.bind( {} );
WithReset.args = {
	...Default.args,
	allowReset: true,
};

/**
 * Use `marks` to render a visual representation of `step` ticks. Custom mark indicators can be provided by an `Array`.
 */
export const WithMarks = ( props ) => {
	const marksBase = [
		{ value: 0, label: '0' },
		{ value: 1, label: '1' },
		{ value: 2, label: '2' },
		{ value: 8, label: '8' },
		{ value: 10, label: '10' },
	];
	const marksWithDecimal = [
		...marksBase,
		{ value: 3.5, label: '3.5' },
		{ value: 5.8, label: '5.8' },
	];
	const marksWithNegatives = [
		...marksBase,
		{ value: -1, label: '-1' },
		{ value: -2, label: '-2' },
		{ value: -4, label: '-4' },
		{ value: -8, label: '-8' },
	];
	const stepInteger = { min: 0, max: 10, step: 1 };
	const stepDecimal = { min: 0, max: 10, step: 0.1 };
	const minNegative = { min: -10, max: 10, step: 1 };
	const rangeNegative = { min: -10, max: -1, step: 1 };

	const Range = ( localProps ) => {
		const label = Array.isArray( localProps.marks )
			? 'Custom'
			: 'Automatic';
		return <RangeControl { ...{ ...localProps, ...props, label } } />;
	};

	return (
		<>
			<h2>Integer Step</h2>
			<Range marks { ...stepInteger } />
			<Range marks={ marksBase } { ...stepInteger } />

			<h2>Decimal Step</h2>
			<Range marks { ...stepDecimal } />
			<Range marks={ marksWithDecimal } { ...stepDecimal } />

			<h2>Negative Minimum</h2>
			<Range marks { ...minNegative } />
			<Range marks={ marksWithNegatives } { ...minNegative } />

			<h2>Negative Range</h2>
			<Range marks { ...rangeNegative } />
			<Range marks={ marksWithNegatives } { ...rangeNegative } />

			<h2>Any Step</h2>
			<Range marks { ...{ ...stepInteger, step: 'any' } } />
			<Range marks={ marksBase } { ...{ ...stepInteger, step: 'any' } } />
		</>
	);
};
