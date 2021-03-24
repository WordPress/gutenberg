/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { postCategories as icon } from '@wordpress/icons';

const variations = [
	{
		name: 'category',
		title: __( 'Post Categories' ),
		description: __( "Display a post's categories." ),
		icon,
		isDefault: true,
		attributes: { term: 'category' },
		isActive: ( blockAttributes ) => blockAttributes.term === 'category',
	},
];

export default variations;
