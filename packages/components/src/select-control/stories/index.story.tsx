/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SelectControl from '../';

const meta: Meta< typeof SelectControl > = {
	title: 'Components/SelectControl',
	component: SelectControl,
	argTypes: {
		help: { control: { type: 'text' } },
		label: { control: { type: 'text' } },
		prefix: { control: { type: 'text' } },
		suffix: { control: { type: 'text' } },
		value: { control: { type: null } },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const SelectControlWithState: StoryFn< typeof SelectControl > = ( props ) => {
	const [ selection, setSelection ] = useState< string[] >();

	if ( props.multiple ) {
		return (
			<SelectControl
				{ ...props }
				multiple
				value={ selection }
				onChange={ ( value ) => {
					setSelection( value );
					props.onChange?.( value );
				} }
			/>
		);
	}

	return (
		<SelectControl
			{ ...props }
			multiple={ false }
			value={ selection?.[ 0 ] }
			onChange={ ( value ) => {
				setSelection( [ value ] );
				props.onChange?.( value );
			} }
		/>
	);
};

export const Default = SelectControlWithState.bind( {} );
Default.args = {
	options: [
		{ value: '', label: 'Select an Option', disabled: true },
		{ value: 'a', label: 'Option A' },
		{ value: 'b', label: 'Option B' },
		{ value: 'c', label: 'Option C' },
	],
};

export const WithLabelAndHelpText = SelectControlWithState.bind( {} );
WithLabelAndHelpText.args = {
	...Default.args,
	help: 'Help text to explain the select control.',
	label: 'Value',
};

/**
 * As an alternative to the `options` prop, `optgroup`s and `options` can be
 * passed in as `children` for more customizeability.
 */
export const WithCustomChildren: StoryFn< typeof SelectControl > = ( args ) => {
	return (
		<SelectControlWithState { ...args }>
			<option value="option-1">Option 1</option>
			<option value="option-2" disabled>
				Option 2 - Disabled
			</option>
			<optgroup label="Option Group 1">
				<option value="option-group-1-option-1">
					Option Group 1 - Option 1
				</option>
				<option value="option-group-1-option-2" disabled>
					Option Group 1 - Option 2 - Disabled
				</option>
			</optgroup>
		</SelectControlWithState>
	);
};
