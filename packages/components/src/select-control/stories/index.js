/**
 * External dependencies
 */
import { boolean, object, select, text } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SelectControl from '..';

export default {
	title: 'Components/SelectControl',
	component: SelectControl,
	parameters: {
		knobs: { disable: false },
	},
};

const SelectControlWithState = ( props ) => {
	const [ selection, setSelection ] = useState();

	return (
		<SelectControl
			{ ...props }
			value={ selection }
			onChange={ setSelection }
		/>
	);
};

export const _default = () => {
	const props = {
		disabled: boolean( 'disabled', false ),
		help: text( 'help', 'Help text to explain the select control.' ),
		hideLabelFromVision: boolean( 'hideLabelFromVision', false ),
		label: text( 'label', 'Value' ),
		labelPosition: select(
			'labelPosition',
			{
				top: 'top',
				side: 'side',
				bottom: 'bottom',
			},
			'top'
		),
		multiple: boolean( 'multiple', false ),
		options: object( 'Options', [
			{ value: null, label: 'Select an Option', disabled: true },
			{ value: 'a', label: 'Option A' },
			{ value: 'b', label: 'Option B' },
			{ value: 'c', label: 'Option C' },
		] ),
		size: select(
			'size',
			{
				default: 'default',
				small: 'small',
				'__unstable-large': '__unstable-large',
			},
			'default'
		),
	};

	return <SelectControlWithState { ...props } />;
};

export const withCustomChildren = () => {
	return (
		<SelectControlWithState label="Value">
			<option value="option-1">Option 1</option>
			<option value="option-2" disabled>
				Option 2 - Disabled
			</option>
			<option value="option-3">Option 3</option>
			<optgroup label="Option Group 1">
				<option value="option-group-1-option-1">
					Option Group 1 - Option 1
				</option>
				<option value="option-group-1-option-2" disabled>
					Option Group 1 - Option 2 - Disabled
				</option>
				<option value="option-group-1-option-3">
					Option Group 1 - Option 3
				</option>
			</optgroup>
			<optgroup label="Option Group 2">
				<option value="option-group-2-option-1">
					Option Group 2 - Option 1
				</option>
				<option value="option-group-2-option-2" disabled>
					Option Group 2 - Option 2 - Disabled
				</option>
				<option value="option-group-2-option-3">
					Option Group 2 - Option 3
				</option>
			</optgroup>
		</SelectControlWithState>
	);
};
