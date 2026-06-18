import { __ } from '@wordpress/i18n';
import { trendingUp } from '@wordpress/icons';

export default {
	name: 'core/activity',
	title: __( 'Activity' ),
	icon: trendingUp,
	attributes: [
		{
			id: 'perPage',
			type: 'integer',
			label: __( 'Items per page' ),
		},
	],
};
