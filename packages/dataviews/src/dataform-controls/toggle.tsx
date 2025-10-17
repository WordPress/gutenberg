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

const { ValidatedToggleControl } = unlock( privateApis );

export default function Toggle< Item >( {
	field,
	onChange,
	data,
	hideLabelFromVision,
	validity,
}: DataFormControlProps< Item > ) {
	const { label, description, getValue, setValue, isValid } = field;

	const onChangeControl = useCallback( () => {
		onChange(
			setValue( { item: data, value: ! getValue( { item: data } ) } )
		);
	}, [ onChange, setValue, data, getValue ] );

	return (
		<ValidatedToggleControl
			required={ !! isValid.required }
			customValidity={ getCustomValidity( isValid, validity ) }
			hidden={ hideLabelFromVision }
			__nextHasNoMarginBottom
			label={ label }
			help={ description }
			checked={ getValue( { item: data } ) }
			onChange={ onChangeControl }
		/>
	);
}
