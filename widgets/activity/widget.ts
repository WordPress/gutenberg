/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

type ActivityWidgetAttributes = {
	perPage?: number;
};

export default {
	name: 'core/activity',
	title: __( 'Activity' ),
	attributes: [
		{
			id: 'perPage',
			type: 'integer',
			label: __( 'Items per page' ),
		},
	] satisfies WidgetAttributeField< ActivityWidgetAttributes >[],
};
