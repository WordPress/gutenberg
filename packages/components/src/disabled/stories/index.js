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
