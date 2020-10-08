/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

export const TEMPLATES_DEFAULT_DETAILS = {
	// General
	'front-page': {
		title: _x( 'Front Page', 'template name' ),
		description: __(
			'Front page template, whether it displays the blog posts index or a static page'
		),
	},
	archive: {
		title: _x( 'Archive', 'template name' ),
		description: __( 'Generic archive template' ),
	},
	singular: {
		title: _x( 'Singular', 'template name' ),
		description: __( 'Default template for both single posts and pages' ),
	},
	index: {
		title: _x( 'Index', 'template name' ),
		description: __( 'Default template' ),
	},
	search: {
		title: _x( 'Search Results', 'template name' ),
		description: __( 'Search results template' ),
	},
	'404': {
		title: _x( '404 (Not Found)', 'template name' ),
		description: __( 'Template for "not found" errors' ),
	},

	// Pages
	page: {
		title: __( 'Single Page' ),
		description: __( 'Template for single pages' ),
	},

	// Posts
	home: {
		title: __( 'Home Page' ),
		description: __( 'Template for the latest blog posts' ),
	},
	single: {
		title: __( 'Single Post' ),
		description: __( 'Template for single posts' ),
	},
};
