/**
 * WordPress dependencies
 */
import { privateApis, Spinner } from '@wordpress/components';
import { useCallback } from '@wordpress/element';

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

	const onChangeControl = useCallback(
		( newValue: string | null ) =>
			onChange( setValue( { item: data, value: newValue ?? '' } ) ),
		[ data, onChange, setValue ]
	);

	const { elements, isLoading } = useElements( {
		elements: field.elements,
		getElements: field.getElements,
	} );

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
			options={ elements }
			onChange={ onChangeControl }
			hideLabelFromVision={ hideLabelFromVision }
			allowReset
			expandOnFocus
		/>
	);
}
