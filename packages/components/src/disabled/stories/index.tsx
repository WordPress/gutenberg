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
/**
 * External dependencies
 */
import type { ComponentMeta } from '@storybook/react';

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

const Form = () => (
	<div>
		<TextControl label="Text Control" value="" onChange={ () => {} } />
		<TextareaControl
			label="TextArea Control"
			value=""
			onChange={ () => {} }
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

export const Default = () => {
	return (
		<Disabled>
			<Form />
		</Disabled>
	);
};

export const DisabledWithProp = () => {
	const [ isDisabled, setState ] = useState( true );
	const toggleDisabled = () => {
		setState( () => ! isDisabled );
	};

	return (
		<div>
			<Disabled isDisabled={ isDisabled }>
				<Form />
			</Disabled>
			<Button variant="primary" onClick={ toggleDisabled }>
				Set isDisabled to { isDisabled ? 'false' : 'true' }
			</Button>
		</div>
	);
};
