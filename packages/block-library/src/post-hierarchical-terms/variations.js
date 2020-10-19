/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const variations = [
	{
		name: 'category',
		title: __( 'Post Categories' ),
		icon: 'category',
		is_default: true,
		attributes: { term: 'category' },
	},
];

export default variations;
