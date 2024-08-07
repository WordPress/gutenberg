/**
 * WordPress dependencies
 */
import { BaseControl, TimePicker, SelectControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import type {
	SortDirection,
	ValidationContext,
	DataFormControlProps,
} from '../types';

function sort( a: any, b: any, direction: SortDirection ) {
	const timeA = new Date( a ).getTime();
	const timeB = new Date( b ).getTime();

	return direction === 'asc' ? timeA - timeB : timeB - timeA;
}

function isValid( value: any, context?: ValidationContext ) {
	if ( context?.elements ) {
		const validValues = context?.elements.map( ( f ) => f.value );
		if ( ! validValues.includes( value ) ) {
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
	const { id, label } = field;
	const value = field.getValue( { item: data } );

	const instanceId = useInstanceId( TimePicker, `datetime-field-${ id }` );

	const onChangeControl = useCallback(
		( newValue: string | null ) =>
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
		<BaseControl id={ instanceId } label={ label }>
			<TimePicker
				id={ instanceId }
				currentTime={ value }
				onChange={ onChangeControl }
				hideLabelFromVision
			/>
		</BaseControl>
	);
}

export default {
	sort,
	isValid,
	Edit,
};
