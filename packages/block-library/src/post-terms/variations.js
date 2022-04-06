/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { postCategories, postTerms } from '@wordpress/icons';

const variations = [
	{
		name: 'category',
		title: __( 'Post Categories' ),
		description: __( "Display a post's categories." ),
		icon: postCategories,
		isDefault: true,
		attributes: { term: 'category' },
		isActive: ( blockAttributes ) => blockAttributes.term === 'category',
	},

	{
		name: 'post_tag',
		title: __( 'Post Tags' ),
		description: __( "Display a post's tags." ),
		icon: postTerms,
		attributes: { term: 'post_tag' },
		isActive: ( blockAttributes ) => blockAttributes.term === 'post_tag',
	},
];

export default variations;
