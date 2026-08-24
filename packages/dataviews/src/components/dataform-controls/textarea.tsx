import { ValidatedTextareaControl } from '@wordpress/ui';
import { useCallback } from '@wordpress/element';
import type { DataFormControlProps } from '../../types';
import getCustomValidity from './utils/get-custom-validity';

export default function Textarea< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	markWhenOptional,
	config,
	validity,
}: DataFormControlProps< Item > ) {
	const { rows = 4 } = config || {};
	const disabled = field.isDisabled( { item: data, field } );
	const { label, placeholder, description, setValue, isValid } = field;
	const value = field.getValue( { item: data } );

	const onValueChangeControl = useCallback(
		( newValue: string ) =>
			onChange( setValue( { item: data, value: newValue } ) ),
		[ data, onChange, setValue ]
	);

	return (
		<ValidatedTextareaControl
			required={ !! isValid.required }
			markWhenOptional={ markWhenOptional }
			customValidity={ getCustomValidity( isValid, validity ) }
			label={ label }
			placeholder={ placeholder }
			value={ value ?? '' }
			description={
				typeof description === 'string' ? description : undefined
			}
			details={
				typeof description === 'string' ? undefined : description
			}
			onValueChange={ onValueChangeControl }
			rows={ rows }
			disabled={ disabled }
			minLength={
				isValid.minLength ? isValid.minLength.constraint : undefined
			}
			maxLength={
				isValid.maxLength ? isValid.maxLength.constraint : undefined
			}
			hideLabelFromVision={ hideLabelFromVision }
		/>
	);
}
