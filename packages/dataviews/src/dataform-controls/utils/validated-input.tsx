/**
 * WordPress dependencies
 */
import { privateApis } from '@wordpress/components';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../../types';
import { unlock } from '../../lock-unlock';
import getCustomValidity from './get-custom-validity';

const { ValidatedInputControl } = unlock( privateApis );

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
	type,
	prefix,
	suffix,
	validity,
}: DataFormValidatedTextControlProps< Item > ) {
	const { label, placeholder, description, getValue, setValue, isValid } =
		field;
	const value = getValue( { item: data } );

	const onChangeControl = useCallback(
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
			required={ !! isValid?.required }
			customValidity={ getCustomValidity( isValid, validity ) }
			label={ label }
			placeholder={ placeholder }
			value={ value ?? '' }
			help={ description }
			onChange={ onChangeControl }
			hideLabelFromVision={ hideLabelFromVision }
			type={ type }
			prefix={ prefix }
			suffix={ suffix }
			__next40pxDefaultSize
		/>
	);
}
