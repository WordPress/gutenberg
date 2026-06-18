/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { HomeTemplateData } from '../../types';

const postsPerPageField: Field< HomeTemplateData > = {
	id: 'posts_per_page',
	type: 'integer',
	label: __( 'Posts per page' ),
	description: __(
		'Set the default number of posts to display on blog pages, including categories and tags. Some templates may override this setting.'
	),
	// The value lives in the `root/site` entity, merged into the form data under
	// the `root_site` namespace by the editor. Edits are routed back to that
	// entity by the editor.
	getValue: ( { item } ) => item.root_site?.posts_per_page ?? 1,
	setValue: ( { value } ) => ( { root_site: { posts_per_page: value } } ),
	isVisible: ( item ) => [ 'home', 'index' ].includes( item.slug ?? '' ),
	isValid: { min: 1 },
	enableSorting: false,
	enableHiding: false,
	filterBy: false,
};

/**
 * Posts per page field for the `home`/`index` template summary.
 */
export default postsPerPageField;
