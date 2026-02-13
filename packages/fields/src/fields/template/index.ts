/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { resolveSelect } from '@wordpress/data';
import type { WpTemplate } from '@wordpress/core-data';
import { store as coreDataStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';

const EMPTY_ARRAY: [] = [];

const templateField: Field< BasePost > = {
	id: 'template',
	type: 'text',
	label: __( 'Template' ),
	getElements: async () => {
		const templates: WpTemplate[] =
			( await resolveSelect( coreDataStore ).getEntityRecords(
				'postType',
				'wp_template',
				{
					per_page: -1,
					post_type: 'page', // TODO: this should be data.type
				}
			) ) ?? EMPTY_ARRAY;
		return templates.map( ( { slug, title } ) => ( {
			value: slug,
			label: title.rendered || slug,
		} ) );
	},
	enableSorting: false,
	filterBy: false,
};

/**
 * Template field for BasePost.
 */
export default templateField;
