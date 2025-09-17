/**
 * External dependencies
 */
import deepMerge from 'deepmerge';

/**
 * WordPress dependencies
 */
import { privateApis } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import { unlock } from '../lock-unlock';

const { ValidatedTextareaControl } = unlock( privateApis );

export default function Textarea< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	config,
}: DataFormControlProps< Item > ) {
	const { rows = 4 } = config || {};
	const { label, placeholder, description, setValue } = field;
	const value = field.getValue( { item: data } );
	const [ customValidity, setCustomValidity ] =
		useState<
			React.ComponentProps<
				typeof ValidatedTextareaControl
			>[ 'customValidity' ]
		>( undefined );

	const onChangeControl = useCallback(
		( newValue: string ) =>
			onChange( setValue( { item: data, value: newValue } ) ),
		[ data, onChange, setValue ]
	);

	const onValidateControl = useCallback(
		( newValue: any ) => {
			const message = field.isValid?.custom?.(
				deepMerge(
					data,
					setValue( {
						item: data,
						value: newValue,
					} ) as Partial< Item >
				),
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
		},
		[ data, field, setValue ]
	);

	return (
		<ValidatedTextareaControl
			required={ !! field.isValid?.required }
			onValidate={ onValidateControl }
			customValidity={ customValidity }
			label={ label }
			placeholder={ placeholder }
			value={ value ?? '' }
			help={ description }
			onChange={ onChangeControl }
			rows={ rows }
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			hideLabelFromVision={ hideLabelFromVision }
		/>
	);
}
