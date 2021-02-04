/**
 * External dependencies
 */
import { Text } from '@wp-g2/components';

/**
 * Internal dependencies
 */
import FormGroup, { useFormGroupContextId } from '../index';

// @todo: Refactor this after adding next TextInput component.
const TextInput = ( { id: idProp, ...props } ) => {
	const id = useFormGroupContextId( idProp );
	return (
		<div>
			<input type="text" id={ id } { ...props } />
		</div>
	);
};

export default {
	component: FormGroup,
	title: 'Components/FormGroup',
};

export const _default = () => {
	return (
		<FormGroup label="Form Group">
			<TextInput />
		</FormGroup>
	);
};

export const _labelHidden = () => {
	return (
		<FormGroup label="Form Group" labelHidden>
			<TextInput />
		</FormGroup>
	);
};

export const _help = () => {
	return (
		<FormGroup help={ <Text>Help Text</Text> } label="Form Group">
			<TextInput />
		</FormGroup>
	);
};
