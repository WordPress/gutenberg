import { __ } from '@wordpress/i18n';

export default {
	name: 'core/activity',
	title: __( 'Activity' ),
	attributes: [
		{
			id: 'perPage',
			type: 'integer',
			label: __( 'Items per page' ),
		},
	],
};
