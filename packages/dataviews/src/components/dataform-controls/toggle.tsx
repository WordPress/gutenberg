import { useCallback } from '@wordpress/element';
import type { DataFormControlProps } from '../../types';
import { ValidatedToggleControl } from '../validated-form-controls';
import getCustomValidity from './utils/get-custom-validity';

export default function Toggle< Item >( {
	field,
	onChange,
	data,
	hideLabelFromVision,
	markWhenOptional,
	validity,
}: DataFormControlProps< Item > ) {
	const { label, description, getValue, setValue, isValid } = field;
	const disabled = field.isDisabled( { item: data, field } );

	const onChangeControl = useCallback( () => {
		onChange(
			setValue( { item: data, value: ! getValue( { item: data } ) } )
		);
	}, [ onChange, setValue, data, getValue ] );

	return (
		<ValidatedToggleControl
			required={ !! isValid.required }
			markWhenOptional={ markWhenOptional }
			customValidity={ getCustomValidity( isValid, validity ) }
			hidden={ hideLabelFromVision }
			label={ label }
			help={ description }
			checked={ getValue( { item: data } ) }
			onChange={ onChangeControl }
			disabled={ disabled }
		/>
	);
}
