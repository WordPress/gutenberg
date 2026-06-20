/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { SiteSettings } from '../../types';

const postsPerPageField: Field< SiteSettings > = {
	id: 'posts_per_page',
	type: 'integer',
	label: __( 'Posts per page' ),
	description: __(
		'Set the default number of posts to display on blog pages, including categories and tags. Some templates may override this setting.'
	),
	getValue: ( { item } ) => item.posts_per_page ?? 1,
	setValue: ( { value } ) => ( { posts_per_page: value } ),
	isValid: { min: 1 },
	enableSorting: false,
	enableHiding: false,
	filterBy: false,
};

/**
 * Posts per page field for the `root/site` entity.
 */
export default postsPerPageField;
