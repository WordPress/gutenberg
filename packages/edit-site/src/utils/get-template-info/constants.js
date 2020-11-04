/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Default template details, ordered by perceived importance
 */
export const TEMPLATES_DEFAULT_DETAILS = [
	{
		slug: 'front-page',
		title: _x( 'Front Page', 'template name' ),
		description: __(
			'Front page template, whether it displays the blog posts index or a static page'
		),
	},
	{
		slug: 'index',
		title: _x( 'Index', 'template name' ),
		description: __( 'Default template' ),
	},
	{
		slug: 'home',
		title: __( 'Home Page' ),
		description: __( 'Template for the latest blog posts' ),
	},
	{
		slug: 'page',
		title: __( 'Single Page' ),
		description: __( 'Template for single pages' ),
	},
	{
		slug: 'singular',
		title: _x( 'Singular', 'template name' ),
		description: __( 'Default template for both single posts and pages' ),
	},
	{
		slug: 'single',
		title: __( 'Single Post' ),
		description: __( 'Template for single posts' ),
	},
	{
		slug: 'archive',
		title: _x( 'Archive', 'template name' ),
		description: __( 'Generic archive template' ),
	},
	{
		slug: 'search',
		title: _x( 'Search Results', 'template name' ),
		description: __( 'Search results template' ),
	},
	{
		slug: '404',
		title: _x( '404 (Not Found)', 'template name' ),
		description: __( 'Template for "not found" errors' ),
	},
];
