/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

export const TEMPLATES_DEFAULT_DETAILS = {
	// General
	'front-page': {
		title: _x( 'Front Page', 'template name' ),
		description: __(
			'Front page template, for both a static page or blog posts index'
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
		title: __( 'Page' ),
		description: __( 'Single page template' ),
	},

	// Posts
	home: {
		title: __( 'Home Page' ),
		description: __( 'Template for the latest blog posts' ),
	},
	single: {
		title: _x( 'Single', 'template name' ),
		description: __( 'Single post template' ),
	},
};

export const TEMPLATES_GENERAL = [
	'front-page',
	'archive',
	'single',
	'singular',
	'index',
	'search',
	'404',
];

export const TEMPLATES_POSTS = [ 'single-post', 'archive-post', 'home' ];
