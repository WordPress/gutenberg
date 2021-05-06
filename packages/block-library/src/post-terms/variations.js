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

	{
		name: 'post_tag',
		title: __( 'Post Tags' ),
		description: __( "Display a post's tags." ),
		icon,
		attributes: { term: 'post_tag' },
		isActive: ( blockAttributes ) => blockAttributes.term === 'post_tag',
	},
];

export default variations;
