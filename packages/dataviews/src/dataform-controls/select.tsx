/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import { useFieldElements } from '../field-types';

export default function Select< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	const { id, label, type } = field;
	const isMultiple = type === 'array';
	const value = field.getValue( { item: data } ) ?? ( isMultiple ? [] : '' );
	const onChangeControl = useCallback(
		( newValue: any ) =>
			onChange( {
				[ id ]: newValue,
			} ),
		[ id, onChange ]
	);

	const { elements: fieldElements, isLoading } = useFieldElements( field );

	if ( isLoading ) {
		return <p>loading</p>;
	}

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
		<SelectControl
			label={ label }
			value={ value }
			help={ field.description }
			options={ elements }
			onChange={ onChangeControl }
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			hideLabelFromVision={ hideLabelFromVision }
			multiple={ isMultiple }
		/>
	);
}
