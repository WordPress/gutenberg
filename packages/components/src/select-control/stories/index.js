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
import SelectControl from '../';

export default {
	title: 'Components/SelectControl',
	component: SelectControl,
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
			},
			'default'
		),
	};

	return <SelectControlWithState { ...props } />;
};
