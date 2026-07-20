/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import type { EventsWidgetAttributes } from './types';

export default {
	name: 'core/events',
	icon: calendar,
	attributes: [
		{
			id: 'location',
			type: 'location',
			label: __( 'Event location' ),
			description: __( 'City or region for nearby events.' ),
			relevance: 'high',
		},
	] satisfies WidgetAttributeField< EventsWidgetAttributes >[],
};
