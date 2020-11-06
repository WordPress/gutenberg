/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Disabled, { Disableable as DisableableComponent } from '../';
import Button from '../../button/';
import SelectControl from '../../select-control/';
import TextControl from '../../text-control/';
import TextareaControl from '../../textarea-control/';

export default {
	title: 'Components/Disabled',
	component: Disabled,
};

const Form = () => (
	<div>
		<TextControl label="Text Control" />
		<TextareaControl label="TextArea Control" />
		<SelectControl
			label="Select Control"
			onChange={ () => {} }
			options={ [
				{ value: null, label: 'Select an option', disabled: true },
				{ value: 'a', label: 'Option A' },
				{ value: 'b', label: 'Option B' },
				{ value: 'c', label: 'Option C' },
			] }
		/>
	</div>
);

export const _default = () => {
	return (
		<Disabled>
			<Form />
		</Disabled>
	);
};

export const Disableable = () => {
	const [ isDisabled, setState ] = useState( false );
	const toggleDisabled = () => {
		setState( () => ! isDisabled );
	};

	return (
		<div>
			<DisableableComponent disabled={ isDisabled }>
				<Form />
			</DisableableComponent>
			<Button isPrimary onClick={ toggleDisabled }>
				Toggle Disabled
			</Button>
		</div>
	);
};
