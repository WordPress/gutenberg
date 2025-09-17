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

const { ValidatedToggleControl } = unlock( privateApis );

export default function Toggle< Item >( {
	field,
	onChange,
	data,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	const { label, description, getValue, setValue } = field;
	const [ customValidity, setCustomValidity ] =
		useState<
			React.ComponentProps<
				typeof ValidatedToggleControl
			>[ 'customValidity' ]
		>( undefined );

	const onChangeControl = useCallback( () => {
		onChange(
			setValue( { item: data, value: ! getValue( { item: data } ) } )
		);
	}, [ onChange, setValue, data, getValue ] );

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
		<ValidatedToggleControl
			required={ !! field.isValid.required }
			onValidate={ onValidateControl }
			customValidity={ customValidity }
			hidden={ hideLabelFromVision }
			__nextHasNoMarginBottom
			label={ label }
			help={ description }
			checked={ getValue( { item: data } ) }
			onChange={ onChangeControl }
		/>
	);
}
