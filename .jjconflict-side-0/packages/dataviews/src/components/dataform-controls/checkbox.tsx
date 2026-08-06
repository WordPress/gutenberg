import { useCallback } from '@wordpress/element';
import type { DataFormControlProps } from '../../types';
import { ValidatedCheckboxControl } from '../validated-form-controls';
import getCustomValidity from './utils/get-custom-validity';

export default function Checkbox< Item >( {
	field,
	onChange,
	data,
	hideLabelFromVision,
	markWhenOptional,
	validity,
}: DataFormControlProps< Item > ) {
	const { getValue, setValue, label, description, isValid } = field;
	const disabled = field.isDisabled( { item: data, field } );

	const onChangeControl = useCallback( () => {
		onChange(
			setValue( { item: data, value: ! getValue( { item: data } ) } )
		);
	}, [ data, getValue, onChange, setValue ] );

	return (
		<ValidatedCheckboxControl
			required={ !! field.isValid?.required }
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
