import { Spinner } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import type { DataFormControlProps } from '../../types';
import { ValidatedRadioControl } from '../validated-form-controls';
import getCustomValidity from './utils/get-custom-validity';
import useElements from '../../hooks/use-elements';

export default function Radio< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	markWhenOptional,
	validity,
}: DataFormControlProps< Item > ) {
	const { label, description, getValue, setValue, isValid } = field;
	const disabled = field.isDisabled( { item: data, field } );
	const { elements, isLoading } = useElements( {
		elements: field.elements,
		getElements: field.getElements,
	} );
	const value = getValue( { item: data } );

	const onChangeControl = useCallback(
		( newValue: string ) =>
			onChange( setValue( { item: data, value: newValue } ) ),
		[ data, onChange, setValue ]
	);

	if ( isLoading ) {
		return <Spinner />;
	}

	return (
		<ValidatedRadioControl
			required={ !! field.isValid?.required }
			markWhenOptional={ markWhenOptional }
			customValidity={ getCustomValidity( isValid, validity ) }
			label={ label }
			help={ description }
			onChange={ onChangeControl }
			options={ elements }
			selected={ value }
			hideLabelFromVision={ hideLabelFromVision }
			disabled={ disabled }
		/>
	);
}
