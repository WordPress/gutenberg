/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const variations = [
	{
		name: 'category',
		title: __( 'Post Categories' ),
		icon: 'category',
		isDefault: true,
		attributes: { term: 'category' },
	},
];

export default variations;
