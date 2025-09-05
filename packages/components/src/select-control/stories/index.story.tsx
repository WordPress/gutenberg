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
import { InputControlPrefixWrapper } from '../../input-control/input-prefix-wrapper';

const meta: Meta< typeof SelectControl > = {
	title: 'Components/Selection & Input/Common/SelectControl',
	id: 'components-selectcontrol',
	component: SelectControl,
	argTypes: {
		help: { control: { type: 'text' } },
		label: { control: { type: 'text' } },
		prefix: { control: { type: 'text' } },
		suffix: { control: { type: 'text' } },
		value: { control: false },
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
	__next40pxDefaultSize: true,
	__nextHasNoMarginBottom: true,
	label: 'Label',
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
};

/**
 * As an alternative to the `options` prop, `optgroup`s and `options` can be
 * passed in as `children` for more customizeability.
 */
export const WithCustomChildren = SelectControlWithState.bind( {} );
WithCustomChildren.args = {
	__next40pxDefaultSize: true,
	__nextHasNoMarginBottom: true,
	label: 'Label',
	children: (
		<>
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
		</>
	),
};

/**
 * By default, the prefix is aligned with the edge of the input border, with no padding.
 * If you want to apply standard padding in accordance with the size variant, wrap the element in the `<InputControlPrefixWrapper>` component.
 */
export const WithPrefix = SelectControlWithState.bind( {} );
WithPrefix.args = {
	...Default.args,
	prefix: <InputControlPrefixWrapper>Prefix:</InputControlPrefixWrapper>,
};

export const Minimal = SelectControlWithState.bind( {} );
Minimal.args = {
	...Default.args,
	variant: 'minimal',
	hideLabelFromVision: true,
};
