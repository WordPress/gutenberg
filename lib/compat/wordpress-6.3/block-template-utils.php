<?php
/**
 * Temporary compatibility shims for features present in Gutenberg.
 * This file should be removed when WordPress 6.3.0 becomes the lowest
 * supported version by this plugin.
 *
 * @package gutenberg
 */

/**
 * Updates the list of default template types, containing their
 * localized titles and descriptions.
 *
 * We will only need to update `get_default_block_template_types` function.
 *
 * @param array $default_template_types The default template types.
 *
 * @return array The default template types.
 */
function gutenberg_get_default_block_template_types( $default_template_types ) {
	if ( isset( $default_template_types['index'] ) ) {
		$default_template_types['index'] = array(
			'title'       => _x( 'Index', 'Template name', 'gutenberg' ),
			'description' => __(
				'Used as a fallback template for all pages when a more specific template is not defined.',
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['home'] ) ) {
		$default_template_types['home'] = array(
			'title'       => _x( 'Blog Home', 'Template name', 'gutenberg' ),
			'description' => __(
				'Displays the latest posts as either the site homepage or as the "Posts page" as defined under reading settings. If it exists, the Front Page template overrides this template when posts are shown on the homepage.',
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['front-page'] ) ) {
		$default_template_types['front-page'] = array(
			'title'       => _x( 'Front Page', 'Template name', 'gutenberg' ),
			'description' => __(
				"Displays your site's homepage, whether it is set to display latest posts or a static page. The Front Page template takes precedence over all templates.",
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['singular'] ) ) {
		$default_template_types['singular'] = array(
			'title'       => _x( 'Single Entries', 'Template name', 'gutenberg' ),
			'description' => __(
				'Displays any single entry, such as a post or a page. This template will serve as a fallback when a more specific template (e.g., Single Post, Page, or Attachment) cannot be found.',
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['single'] ) ) {
		$default_template_types['single'] = array(
			'title'       => _x( 'Single Posts', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays single posts on your website unless a custom template has been applied to that post or a dedicated template exists.', 'gutenberg' ),
		);
	}
	if ( isset( $default_template_types['page'] ) ) {
		$default_template_types['page'] = array(
			'title'       => _x( 'Pages', 'Template name', 'gutenberg' ),
			'description' => __( 'Display all static pages unless a custom template has been applied or a dedicated template exists.', 'gutenberg' ),
		);
	}
	if ( isset( $default_template_types['archive'] ) ) {
		$default_template_types['archive'] = array(
			'title'       => _x( 'All Archives', 'Template name', 'gutenberg' ),
			'description' => __(
				'Displays any archive, including posts by a single author, category, tag, taxonomy, custom post type, and date. This template will serve as a fallback when more specific templates (e.g., Category or Tag) cannot be found.',
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['author'] ) ) {
		$default_template_types['author'] = array(
			'title'       => _x( 'Author Archives', 'Template name', 'gutenberg' ),
			'description' => __(
				"Displays a single author's post archive. This template will serve as a fallback when a more a specific template (e.g., Author: Admin) cannot be found.",
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['category'] ) ) {
		$default_template_types['category'] = array(
			'title'       => _x( 'Category Archives', 'Template name', 'gutenberg' ),
			'description' => __(
				'Displays a post category archive. This template will serve as a fallback when more specific template (e.g., Category: Recipes) cannot be found.',
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['taxonomy'] ) ) {
		$default_template_types['taxonomy'] = array(
			'title'       => _x( 'Taxonomy', 'Template name', 'gutenberg' ),
			'description' => __(
				'Displays a custom taxonomy archive. Like categories and tags, taxonomies have terms which you use to classify things. For example: a taxonomy named "Art" can have multiple terms, such as "Modern" and "18th Century." This template will serve as a fallback when a more specific template (e.g, Taxonomy: Art) cannot be found.',
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['date'] ) ) {
		$default_template_types['date'] = array(
			'title'       => _x( 'Date Archives', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays a post archive when a specific date is visited (e.g., example.com/2023/).', 'gutenberg' ),
		);
	}
	if ( isset( $default_template_types['tag'] ) ) {
		$default_template_types['tag'] = array(
			'title'       => _x( 'Tag Archives', 'Template name', 'gutenberg' ),
			'description' => __(
				'Displays a post tag archive. This template will serve as a fallback when more specific template (e.g., Tag: Pizza) cannot be found.',
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['attachment'] ) ) {
		$default_template_types['attachment'] = array(
			'title'       => _x( 'Attachment Pages', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays when a visitor views the dedicated page that exists for any media attachment.', 'gutenberg' ),
		);
	}
	if ( isset( $default_template_types['search'] ) ) {
		$default_template_types['search'] = array(
			'title'       => _x( 'Search Results', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays when a visitor performs a search on your website.', 'gutenberg' ),
		);
	}
	if ( isset( $default_template_types['privacy-policy'] ) ) {
		$default_template_types['privacy-policy'] = array(
			'title'       => _x( 'Privacy Policy', 'Template name', 'gutenberg' ),
			'description' => __(
				"Displays your site's Privacy Policy page.",
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['404'] ) ) {
		$default_template_types['404'] = array(
			'title'       => _x( 'Page: 404', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays when a visitor views a non-existent page, such as a dead link or a mistyped URL.', 'gutenberg' ),
		);
	}

	return $default_template_types;
}
add_filter( 'default_template_types', 'gutenberg_get_default_block_template_types', 10 );
