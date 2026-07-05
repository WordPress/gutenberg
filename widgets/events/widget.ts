/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import {
	LocationSettingControl,
	type EventsWidgetAttributes,
} from './components/location-setting-control';

export default {
	name: 'core/events',
	title: __( 'WordPress events' ),
	icon: calendar,
	attributes: [
		{
			id: 'location',
			type: 'text',
			label: __( 'Event location' ),
			description: __(
				'City or region for nearby events. Edits apply when you save this panel.'
			),
			Edit: LocationSettingControl,
		},
	] satisfies WidgetAttributeField< EventsWidgetAttributes >[],
};
