/**
 * WordPress dependencies
 */
import { privateApis, Spinner } from '@wordpress/components';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import useElements from '../hooks/use-elements';
import { unlock } from '../lock-unlock';
import getCustomValidity from './utils/get-custom-validity';

const { ValidatedSelectControl } = unlock( privateApis );

export default function Select< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	validity,
}: DataFormControlProps< Item > ) {
	const { type, label, description, getValue, setValue, isValid } = field;

	const isMultiple = type === 'array';
	const value = getValue( { item: data } ) ?? ( isMultiple ? [] : '' );

	const onChangeControl = useCallback(
		( newValue: any ) =>
			onChange( setValue( { item: data, value: newValue } ) ),
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
		<ValidatedSelectControl
			required={ !! field.isValid?.required }
			customValidity={ getCustomValidity( isValid, validity ) }
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
