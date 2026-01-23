/**
 * WordPress dependencies
 */
import { privateApis, Spinner } from '@wordpress/components';
import { useCallback, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../../types';
import useElements from '../../hooks/use-elements';
import { unlock } from '../../lock-unlock';
import getCustomValidity from './utils/get-custom-validity';

const { ValidatedComboboxControl } = unlock( privateApis );

export default function Combobox< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	validity,
}: DataFormControlProps< Item > ) {
	const { label, description, placeholder, getValue, setValue, isValid } =
		field;
	const value = getValue( { item: data } ) ?? '';

	const [ filterValue, setFilterValue ] = useState( '' );

	const onChangeControl = useCallback(
		( newValue: string | null ) =>
			onChange( setValue( { item: data, value: newValue ?? '' } ) ),
		[ data, onChange, setValue ]
	);

	const { elements, isLoading } = useElements( {
		elements: field.elements,
		getElements: field.getElements,
	} );

	const filteredOptions = useMemo( () => {
		if ( ! filterValue ) {
			return elements;
		}
		const normalizedFilter = filterValue.toLowerCase();
		return elements.filter( ( option ) =>
			option.label.toLowerCase().includes( normalizedFilter )
		);
	}, [ elements, filterValue ] );

	const onFilterValueChange = useCallback( ( inputValue: string ) => {
		setFilterValue( inputValue );
	}, [] );

	if ( isLoading ) {
		return <Spinner />;
	}

	return (
		<ValidatedComboboxControl
			required={ !! field.isValid?.required }
			customValidity={ getCustomValidity( isValid, validity ) }
			label={ label }
			value={ value }
			help={ description }
			placeholder={ placeholder }
			options={ filteredOptions }
			onChange={ onChangeControl }
			onFilterValueChange={ onFilterValueChange }
			hideLabelFromVision={ hideLabelFromVision }
			allowReset
			expandOnFocus
		/>
	);
}
