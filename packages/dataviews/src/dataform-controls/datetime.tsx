/**
 * WordPress dependencies
 */
import { BaseControl, TimePicker, VisuallyHidden } from '@wordpress/components';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import { OPERATOR_IN_THE_PAST, OPERATOR_OVER } from '../constants';
import RelativeDateControl, {
	TIME_UNITS_OPTIONS,
} from './relative-date-control';

export default function DateTime< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	operator,
}: DataFormControlProps< Item > ) {
	const { id, label } = field;
	const value = field.getValue( { item: data } );

	const onChangeControl = useCallback(
		( newValue: string | null ) => onChange( { [ id ]: newValue } ),
		[ id, onChange ]
	);

	if ( operator === OPERATOR_IN_THE_PAST || operator === OPERATOR_OVER ) {
		return (
			<RelativeDateControl
				id={ id }
				value={ value && typeof value === 'object' ? value : {} }
				onChange={ onChange }
				label={ label }
				hideLabelFromVision={ hideLabelFromVision }
				options={ TIME_UNITS_OPTIONS[ operator ] }
			/>
		);
	}

	return (
		<fieldset className="dataviews-controls__datetime">
			{ ! hideLabelFromVision && (
				<BaseControl.VisualLabel as="legend">
					{ label }
				</BaseControl.VisualLabel>
			) }
			{ hideLabelFromVision && (
				<VisuallyHidden as="legend">{ label }</VisuallyHidden>
			) }
			<TimePicker
				currentTime={ typeof value === 'string' ? value : undefined }
				onChange={ onChangeControl }
				hideLabelFromVision
			/>
		</fieldset>
	);
}
