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
import Disabled from '../';
import SelectControl from '../../select-control/';
import TextControl from '../../text-control/';
import TextareaControl from '../../textarea-control/';
import { VStack } from '../../v-stack/';

const meta: Meta< typeof Disabled > = {
	title: 'Components/Utilities/Disabled',
	id: 'components-disabled',
	component: Disabled,
	argTypes: {
		as: { control: false },
		children: { control: false },
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
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
				__next40pxDefaultSize
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
				__next40pxDefaultSize
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

export const Default: StoryFn< typeof Disabled > = ( args ) => {
	return (
		<Disabled { ...args }>
			<Form />
		</Disabled>
	);
};
Default.args = {
	isDisabled: true,
};

export const ContentEditable: StoryFn< typeof Disabled > = ( args ) => {
	return (
		<Disabled { ...args }>
			<div contentEditable tabIndex={ 0 } suppressContentEditableWarning>
				contentEditable
			</div>
		</Disabled>
	);
};
ContentEditable.args = {
	isDisabled: true,
};
