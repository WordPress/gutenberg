/**
 * WordPress dependencies
 */
import { BaseControl, TimePicker } from '@wordpress/components';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';

export default function DateTime< Item >( {
	data,
	field,
	onChange,
}: DataFormControlProps< Item > ) {
	const { id, label } = field;
	const value = field.getValue( { item: data } );

	const onChangeControl = useCallback(
		( newValue: string | null ) => onChange( { [ id ]: newValue } ),
		[ id, onChange ]
	);

	return (
		<fieldset>
			<BaseControl.VisualLabel as="legend">
				{ label }
			</BaseControl.VisualLabel>
			<TimePicker
				currentTime={ value }
				onChange={ onChangeControl }
				hideLabelFromVision
			/>
		</fieldset>
	);
}
