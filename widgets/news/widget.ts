import { __ } from '@wordpress/i18n';

export default {
	name: 'core/news',
	title: __( 'WordPress news' ),
	attributes: [
		{
			id: 'perPage',
			type: 'integer',
			label: __( 'News per page' ),
		},
	],
};
