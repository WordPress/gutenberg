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
import Disabled from '../';
import SelectControl from '../../select-control/';
import TextControl from '../../text-control/';
import TextareaControl from '../../textarea-control/';
import { VStack } from '../../v-stack/';

const meta: ComponentMeta< typeof Disabled > = {
	title: 'Components/Disabled',
	component: Disabled,
	argTypes: {
		as: { control: { type: null } },
		children: { control: { type: null } },
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { source: { state: 'open' } },
	},
};

export default meta;

const Form = () => {
	const [ textControlValue, setTextControlValue ] = useState( '' );
	const [ textAreaValue, setTextAreaValue ] = useState( '' );
	return (
		<VStack>
			<TextControl
				__nextHasNoMarginBottom
				label="Text Control"
				value={ textControlValue }
				onChange={ setTextControlValue }
			/>
			<TextareaControl
				__nextHasNoMarginBottom
				label="TextArea Control"
				value={ textAreaValue }
				onChange={ setTextAreaValue }
			/>
			<SelectControl
				__nextHasNoMarginBottom
				label="Select Control"
				onChange={ () => {} }
				options={ [
					{ value: '', label: 'Select an option', disabled: true },
					{ value: 'a', label: 'Option A' },
					{ value: 'b', label: 'Option B' },
					{ value: 'c', label: 'Option C' },
				] }
			/>
		</VStack>
	);
};

export const Default: ComponentStory< typeof Disabled > = ( args ) => {
	return (
		<Disabled { ...args }>
			<Form />
		</Disabled>
	);
};
Default.args = {
	isDisabled: true,
};

export const ContentEditable: ComponentStory< typeof Disabled > = ( args ) => {
	return (
		<Disabled { ...args }>
			<div contentEditable tabIndex={ 0 }>
				contentEditable
			</div>
		</Disabled>
	);
};
ContentEditable.args = {
	isDisabled: true,
};
