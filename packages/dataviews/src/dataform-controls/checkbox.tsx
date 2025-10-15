/**
 * WordPress dependencies
 */
import { privateApis } from '@wordpress/components';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import { unlock } from '../lock-unlock';
import getCustomValidity from './utils/get-custom-validity';

const { ValidatedCheckboxControl } = unlock( privateApis );

export default function Checkbox< Item >( {
	field,
	onChange,
	data,
	hideLabelFromVision,
	validity,
}: DataFormControlProps< Item > ) {
	const { getValue, setValue, label, description, isValid } = field;

	const onChangeControl = useCallback( () => {
		onChange(
			setValue( { item: data, value: ! getValue( { item: data } ) } )
		);
	}, [ data, getValue, onChange, setValue ] );

	return (
		<ValidatedCheckboxControl
			required={ !! field.isValid?.required }
			customValidity={ getCustomValidity( isValid, validity ) }
			hidden={ hideLabelFromVision }
			label={ label }
			help={ description }
			checked={ getValue( { item: data } ) }
			onChange={ onChangeControl }
		/>
	);
}
