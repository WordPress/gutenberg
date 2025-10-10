/**
 * WordPress dependencies
 */
import { privateApis, Spinner } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import { unlock } from '../lock-unlock';
import getCustomValidity from './utils/get-custom-validity';
import useElements from '../hooks/use-elements';

const { ValidatedRadioControl } = unlock( privateApis );

export default function Radio< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	validity,
}: DataFormControlProps< Item > ) {
	const { label, description, elements, getValue, setValue, isValid } = field;
	const { elements, isLoading } = useElements(
		field.elements,
		field.getElements
	);
	const value = getValue( { item: data } );

	const onChangeControl = useCallback(
		( newValue: string ) =>
			onChange( setValue( { item: data, value: newValue } ) ),
		[ data, onChange, setValue ]
	);

	if ( isLoading ) {
		return <Spinner />;
	}

	if ( elements.length === 0 ) {
		return null;
	}

	return (
		<ValidatedRadioControl
			required={ !! field.isValid?.required }
			customValidity={ getCustomValidity( isValid, validity ) }
			label={ label }
			help={ description }
			onChange={ onChangeControl }
			options={ elements }
			selected={ value }
			hideLabelFromVision={ hideLabelFromVision }
		/>
	);
}
