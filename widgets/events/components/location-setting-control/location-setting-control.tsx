/**
 * WordPress dependencies
 */
import type { DataFormControlProps } from '@wordpress/dataviews';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { LocationPicker } from '../location-picker';

export type EventsWidgetAttributes = {
	location?: string;
};

/*
 * Custom DataForm control for the dashboard widget settings drawer.
 * Reuses the main widget location picker (city search + geolocation).
 */
export function LocationSettingControl( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< EventsWidgetAttributes > ) {
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
			selectButton={ false }
			onChange={ onLocationChange }
		/>
	);
}
