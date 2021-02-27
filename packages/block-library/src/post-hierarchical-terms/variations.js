/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { category } from '@wordpress/icons';

const variations = [
	{
		name: 'category',
		title: __( 'Post Categories' ),
		description: __( "Display a post's categories." ),
		icon: category,
		isDefault: true,
		attributes: { term: 'category' },
	},
];

export default variations;
