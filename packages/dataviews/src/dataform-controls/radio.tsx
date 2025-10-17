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

const { ValidatedRadioControl } = unlock( privateApis );

export default function Radio< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	validity,
}: DataFormControlProps< Item > ) {
	const { label, description, elements, getValue, setValue, isValid } = field;
	const value = getValue( { item: data } );

	const onChangeControl = useCallback(
		( newValue: string ) =>
			onChange( setValue( { item: data, value: newValue } ) ),
		[ data, onChange, setValue ]
	);

	if ( elements ) {
		return (
			<ValidatedRadioControl
				required={ !! isValid?.required }
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

	return null;
}
