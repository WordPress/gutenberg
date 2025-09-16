/**
 * WordPress dependencies
 */
import { privateApis } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../../types';
import { unlock } from '../../lock-unlock';

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
}: DataFormValidatedTextControlProps< Item > ) {
	const { id, label, placeholder, description } = field;
	const value = field.getValue( { item: data } );
	const [ customValidity, setCustomValidity ] =
		useState<
			React.ComponentProps<
				typeof ValidatedInputControl
			>[ 'customValidity' ]
		>( undefined );

	const onChangeControl = useCallback(
		( newValue: string ) =>
			onChange( {
				[ id ]: newValue,
			} ),
		[ id, onChange ]
	);

	return (
		<ValidatedInputControl
			required={ !! field.isValid?.required }
			onValidate={ ( newValue: any ) => {
				const message = field.isValid?.custom?.(
					{
						...data,
						[ id ]: newValue,
					},
					field
				);

				if ( message ) {
					setCustomValidity( {
						type: 'invalid',
						message,
					} );
					return;
				}

				setCustomValidity( undefined );
			} }
			customValidity={ customValidity }
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
