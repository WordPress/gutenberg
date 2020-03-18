/**
 * Internal dependencies
 */
import Disabled from '../';
import SelectControl from '../../select-control/';
import TextControl from '../../text-control/';
import TextareaControl from '../../textarea-control/';

export default {
	title: 'Components/Disabled',
	component: Disabled,
};

export const _default = () => {
	return (
		<Disabled>
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
		</Disabled>
	);
};
