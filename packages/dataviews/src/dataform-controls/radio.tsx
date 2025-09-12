/**
 * WordPress dependencies
 */
import { RadioControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';

export default function Radio< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	const { label, getValue, setValue } = field;
	const value = getValue( { item: data } );

	const onChangeControl = useCallback(
		( newValue: string ) =>
			onChange( setValue( { item: data, value: newValue } ) ),
		[ data, onChange, setValue ]
	);

	if ( field.elements ) {
		return (
			<RadioControl
				label={ label }
				onChange={ onChangeControl }
				options={ field.elements }
				selected={ value }
				hideLabelFromVision={ hideLabelFromVision }
			/>
		);
	}

	return null;
}
