/**
 * WordPress dependencies
 */
import { privateApis } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

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
	const { id, type, label, description } = field;
	const [ customValidity, setCustomValidity ] =
		useState<
			React.ComponentProps<
				typeof ValidatedSelectControl
			>[ 'customValidity' ]
		>( undefined );

	const isMultiple = type === 'array';
	const value = field.getValue( { item: data } ) ?? ( isMultiple ? [] : '' );
	const onChangeControl = useCallback(
		( newValue: any ) =>
			onChange( {
				[ id ]: newValue,
			} ),
		[ id, onChange ]
	);

	const fieldElements = field?.elements ?? [];
	const hasEmptyValue = fieldElements.some(
		( { value: elementValue } ) => elementValue === ''
	);

	const elements =
		hasEmptyValue || isMultiple
			? fieldElements
			: [
					/*
					 * Value can be undefined when:
					 *
					 * - the field is not required
					 * - in bulk editing
					 *
					 */
					{ label: __( 'Select item' ), value: '' },
					...fieldElements,
			  ];

	return (
		<ValidatedSelectControl
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
