/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

const NAVIGATION_POST_TYPE = 'wp_navigation';

const PRELOADED_NAVIGATION_MENUS_QUERY = {
	per_page: -1,
	status: [ 'publish', 'draft' ],
	order: 'desc',
	orderby: 'date',
};

export const route = {
	title: () => __( 'Navigation' ),
	canvas: async ( context: { search: Record< string, any > } ) => {
		const { search } = context;
		// If a navigation is selected or being edited, use the custom canvas module.
		if ( search.ids?.length > 0 || search.editId ) {
			return null;
		}
		// No selection — show the homepage preview.
		return { isPreview: true };
	},
	loader: async () => {
		await Promise.all( [
			// Preload navigation menus
			resolveSelect( coreStore ).getEntityRecords(
				'postType',
				NAVIGATION_POST_TYPE,
				PRELOADED_NAVIGATION_MENUS_QUERY
			),
			resolveSelect( coreStore ).canUser( 'create', {
				kind: 'postType',
				name: NAVIGATION_POST_TYPE,
			} ),
			// Preload post type object (what usePostFields needs)
			resolveSelect( coreStore ).getPostType( NAVIGATION_POST_TYPE ),
			// Preload users data (what usePostFields needs for author field)
			resolveSelect( coreStore ).getEntityRecords( 'root', 'user', {
				per_page: -1,
			} ),
			// Preload template parts for status badges
			resolveSelect( coreStore ).getEntityRecords(
				'postType',
				'wp_template_part',
				{ per_page: -1 }
			),
			// Preload fallback navigation menu for "used in" detection
			resolveSelect( coreStore ).getEntityRecords(
				'postType',
				'wp_navigation',
				{
					per_page: 1,
					orderby: 'date',
					order: 'desc',
					status: 'publish',
					_fields: 'id',
				}
			),
		] );
	},
};
