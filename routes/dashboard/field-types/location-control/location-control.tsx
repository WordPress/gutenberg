/**
 * WordPress dependencies
 */
import type { DataFormControlProps } from '@wordpress/dataviews';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { LocationPicker } from '../location-picker';

/*
 * DataForm Edit control for the `location` field type: a city search
 * with autocomplete and geolocation, wired to the field's
 * getValue/setValue pair.
 */
export function LocationControl< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	const value = field.getValue( { item: data } ) as string | undefined;

	const onLocationChange = useCallback(
		( location: string ) => {
			onChange(
				field.setValue( {
					item: data,
					value: location.trim(),
				} )
			);
		},
		[ data, field, onChange ]
	);

	return (
		<LocationPicker
			seedInput={ value ?? '' }
			hideLabelFromVision={ hideLabelFromVision }
			showDescription={ ! hideLabelFromVision }
			selectButton={ false }
			onChange={ onLocationChange }
		/>
	);
}
