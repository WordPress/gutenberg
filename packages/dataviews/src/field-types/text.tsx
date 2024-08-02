/**
 * WordPress dependencies
 */
import { TextControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type {
	SortDirection,
	ValidationContext,
	DataFormControlProps,
} from '../types';

function sort( valueA: any, valueB: any, direction: SortDirection ) {
	return direction === 'asc'
		? valueA.localeCompare( valueB )
		: valueB.localeCompare( valueA );
}

function isValid( value: any, context?: ValidationContext ) {
	if ( context?.elements ) {
		const validValues = context?.elements?.map( ( f ) => f.value );
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
	const { id, label, placeholder } = field;
	const value = field.getValue( { item: data } );

	const onChangeControl = useCallback(
		( newValue: string ) =>
			onChange( ( prevItem: Item ) => ( {
				...prevItem,
				[ id ]: newValue,
			} ) ),
		[ id, onChange ]
	);

	return (
		<TextControl
			label={ label }
			placeholder={ placeholder }
			value={ value ?? '' }
			onChange={ onChangeControl }
			__next40pxDefaultSize
			__nextHasNoMarginBottom
		/>
	);
}

export default {
	sort,
	isValid,
	Edit,
};
