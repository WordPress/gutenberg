import { ValidatedInputControl } from '@wordpress/ui';
import { useCallback } from '@wordpress/element';
import type { DataFormControlProps } from '../../../types';
import getCustomValidity from './get-custom-validity';

export type DataFormValidatedTextControlProps< Item > =
	DataFormControlProps< Item > & {
		/**
		 * The input type of the control.
		 */
		type?: 'text' | 'email' | 'tel' | 'url' | 'password';
		/**
		 * Optional prefix element to display before the input.
		 */
		prefix?: React.ReactElement;
		/**
		 * Optional suffix element to display after the input.
		 */
		suffix?: React.ReactElement;
	};

export default function ValidatedText< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	markWhenOptional,
	type,
	prefix,
	suffix,
	validity,
}: DataFormValidatedTextControlProps< Item > ) {
	const { label, placeholder, description, getValue, setValue, isValid } =
		field;
	const value = getValue( { item: data } );
	const disabled = field.isDisabled( { item: data, field } );

	const onValueChangeControl = useCallback(
		( newValue: string ) =>
			onChange(
				setValue( {
					item: data,
					value: newValue,
				} )
			),
		[ data, setValue, onChange ]
	);

	return (
		<ValidatedInputControl
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
			hideLabelFromVision={ hideLabelFromVision }
			type={ type }
			prefix={ prefix }
			suffix={ suffix }
			disabled={ disabled }
			pattern={ isValid.pattern ? isValid.pattern.constraint : undefined }
			minLength={
				isValid.minLength ? isValid.minLength.constraint : undefined
			}
			maxLength={
				isValid.maxLength ? isValid.maxLength.constraint : undefined
			}
		/>
	);
}
