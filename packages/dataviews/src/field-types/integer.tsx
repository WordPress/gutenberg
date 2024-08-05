/**
 * WordPress dependencies
 */
import {
	__experimentalNumberControl as NumberControl,
	SelectControl,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type {
	SortDirection,
	ValidationContext,
	DataFormControlProps,
} from '../types';

function sort( a: any, b: any, direction: SortDirection ) {
	return direction === 'asc' ? a - b : b - a;
}

function isValid( value: any, context?: ValidationContext ) {
	// TODO: this implicitely means the value is required.
	if ( value === '' ) {
		return false;
	}

	if ( ! Number.isInteger( Number( value ) ) ) {
		return false;
	}

	if ( context?.elements ) {
		const validValues = context?.elements.map( ( f ) => f.value );
		if ( ! validValues.includes( Number( value ) ) ) {
			return false;
		}
	}

	return true;
}

function Edit< Item >( {
	data,
	field,
	onChange,
}: DataFormControlProps< Item > ) {
	const { id, label, description } = field;
	const value = field.getValue( { item: data } ) ?? '';
	const onChangeControl = useCallback(
		( newValue: string | undefined ) =>
			onChange( ( prevItem: Item ) => ( {
				...prevItem,
				[ id ]: newValue,
			} ) ),
		[ id, onChange ]
	);

	if ( field.elements ) {
		const elements = [
			/*
			 * Value can be undefined when:
			 *
			 * - the field is not required
			 * - in bulk editing
			 *
			 */
			{ label: __( 'Select item' ), value: '' },
			...field.elements,
		];

		return (
			<SelectControl
				label={ label }
				value={ value }
				options={ elements }
				onChange={ onChangeControl }
				__next40pxDefaultSize
				__nextHasNoMarginBottom
			/>
		);
	}

	return (
		<NumberControl
			label={ label }
			help={ description }
			value={ value }
			onChange={ onChangeControl }
			__next40pxDefaultSize
		/>
	);
}

export default {
	sort,
	isValid,
	Edit,
};
