/**
 * External dependencies
 */
import deepMerge from 'deepmerge';

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

	const fieldElements = field?.elements ?? [];
	const hasEmptyValue = fieldElements.some(
		( { value: elementValue } ) => elementValue === ''
	);

	// Determine whether the control currently has a selection.
	// For single-select: value is non-empty (not null/undefined/'').
	// For multi-select: value is an array with length > 0.
	const hasSelection = Array.isArray( value )
		? value.length > 0
		: value !== undefined && value !== null && value !== '';

	/**
	 * Behavior:
	 * - If elements already include an empty value, just use fieldElements.
	 * - If the field is multiple (array) we don't inject a placeholder — use fieldElements.
	 * - Otherwise inject a placeholder item with label "Select" (no ellipsis).
	 *   The placeholder is disabled once there's a selection to prevent re-selection.
	 */
	const elements =
		hasEmptyValue || isMultiple
			? fieldElements
			: [
					{
						label: __( 'Select' ),
						value: '',
						// Disable the placeholder once a selection exists (single-select only).
						disabled: !! hasSelection,
					},
					...fieldElements,
			  ];

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
