/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { breadcrumbs } from '@wordpress/icons';

const variations = [
	{
		name: 'post-breadcrumbs-hierarchical',
		title: __( 'Breadcrumbs' ),
		description: __(
			'Display a breadcrumb trail for Pages or hierarchical post types. The block is useful to insert in the Pages template.'
		),
		attributes: { type: 'hierarchical' },
		isActive: [ 'type' ],
		isDefault: true,
	},
	{
		name: 'post-breadcrumbs-terms',
		title: __( 'Terms Breadcrumbs' ),
		description: __(
			'Display a breadcrumb trail based on taxonomy terms.'
		),
		attributes: { type: 'terms' },
		isActive: [ 'type' ],
	},
];

export default variations.map( ( variation ) => ( {
	...variation,
	icon: breadcrumbs,
	scope: [ 'inserter', 'transform' ],
	isActive: [ 'type' ],
} ) );
