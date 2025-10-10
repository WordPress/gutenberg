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

const { ValidatedSelectControl } = unlock( privateApis );

export default function Select< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	const { type, label, description, getValue, setValue } = field;
	const [ customValidity, setCustomValidity ] =
		useState<
			React.ComponentProps<
				typeof ValidatedSelectControl
			>[ 'customValidity' ]
		>( undefined );

	const isMultiple = type === 'array';
	const value = getValue( { item: data } ) ?? ( isMultiple ? [] : '' );

	const onChangeControl = useCallback(
		( newValue: any ) =>
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

	const elements = field?.elements ?? [];

	return (
		<ValidatedSelectControl
			required={ !! field.isValid?.required }
			onValidate={ onValidateControl }
			customValidity={ customValidity }
			label={ label }
			value={ value }
			help={ description }
			options={ elements }
			onChange={ onChangeControl }
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			hideLabelFromVision={ hideLabelFromVision }
			multiple={ isMultiple }
		/>
	);
}
