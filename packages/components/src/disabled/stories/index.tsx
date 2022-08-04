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
import Button from '../../button/';
import SelectControl from '../../select-control/';
import TextControl from '../../text-control/';
import TextareaControl from '../../textarea-control/';

const meta: ComponentMeta< typeof Disabled > = {
	title: 'Components/Disabled',
	component: Disabled,
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
		<div>
			<TextControl
				label="Text Control"
				value={ textControlValue }
				onChange={ setTextControlValue }
			/>
			<TextareaControl
				label="TextArea Control"
				value={ textAreaValue }
				onChange={ setTextAreaValue }
			/>
			<SelectControl
				label="Select Control"
				onChange={ () => {} }
				options={ [
					{ value: '', label: 'Select an option', disabled: true },
					{ value: 'a', label: 'Option A' },
					{ value: 'b', label: 'Option B' },
					{ value: 'c', label: 'Option C' },
				] }
			/>
		</div>
	);
};

export const Default: ComponentStory< typeof Disabled > = () => {
	return (
		<Disabled>
			<Form />
		</Disabled>
	);
};

export const DisabledWithProp: ComponentStory< typeof Disabled > = () => {
	const [ isDisabled, setState ] = useState( true );
	const toggleDisabled = () => {
		setState( () => ! isDisabled );
	};

	return (
		<>
			<Disabled isDisabled={ isDisabled }>
				<Form />
			</Disabled>
			<Button variant="primary" onClick={ toggleDisabled }>
				Set isDisabled to { isDisabled ? 'false' : 'true' }
			</Button>
		</>
	);
};
