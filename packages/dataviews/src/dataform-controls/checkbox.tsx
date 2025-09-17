/**
 * External dependencies
 */
import deepMerge from 'deepmerge';

/**
 * WordPress dependencies
 */
import { privateApis } from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import { unlock } from '../lock-unlock';

const { ValidatedCheckboxControl } = unlock( privateApis );

export default function Checkbox< Item >( {
	field,
	onChange,
	data,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	const { getValue, setValue, label, description } = field;
	const [ customValidity, setCustomValidity ] =
		useState<
			React.ComponentProps<
				typeof ValidatedCheckboxControl
			>[ 'customValidity' ]
		>( undefined );

	const onChangeControl = useCallback( () => {
		onChange(
			setValue( { item: data, value: ! getValue( { item: data } ) } )
		);
	}, [ data, getValue, onChange, setValue ] );

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
		<ValidatedCheckboxControl
			required={ !! field.isValid?.required }
			onValidate={ onValidateControl }
			customValidity={ customValidity }
			hidden={ hideLabelFromVision }
			label={ label }
			help={ description }
			checked={ getValue( { item: data } ) }
			onChange={ onChangeControl }
		/>
	);
}
