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

const { ValidatedToggleControl } = unlock( privateApis );

export default function Toggle< Item >( {
	field,
	onChange,
	data,
	hideLabelFromVision,
	validity,
}: DataFormControlProps< Item > ) {
	const { label, description, getValue, setValue } = field;

	const onChangeControl = useCallback( () => {
		onChange(
			setValue( { item: data, value: ! getValue( { item: data } ) } )
		);
	}, [ onChange, setValue, data, getValue ] );

	return (
		<ValidatedToggleControl
			required={ !! field.isValid.required }
			customValidity={ validity?.custom ? validity.custom : undefined }
			hidden={ hideLabelFromVision }
			__nextHasNoMarginBottom
			label={ label }
			help={ description }
			checked={ getValue( { item: data } ) }
			onChange={ onChangeControl }
		/>
	);
}
