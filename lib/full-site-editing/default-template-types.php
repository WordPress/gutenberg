<?php
/**
 * Template types.
 *
 * @package gutenberg
 */

/**
 * Returns a filtered list of default template types, containing their
 * localized titles and descriptions.
 *
 * @return array The default template types.
 */
function gutenberg_get_default_template_types() {
	$default_template_types = array(
		'index'          => array(
			'title'       => _x( 'Index', 'Template name', 'gutenberg' ),
			'description' => __( 'The default template which is used when no other template can be found', 'gutenberg' ),
		),
		'home'           => array(
			'title'       => _x( 'Home', 'Template name', 'gutenberg' ),
			'description' => __( 'The home page template, which is the front page by default. If you use a static front page this is the template for the page with the latest posts', 'gutenberg' ),
		),
		'front-page'     => array(
			'title'       => _x( 'Front Page', 'Template name', 'gutenberg' ),
			'description' => __( 'Used when the site home page is queried', 'gutenberg' ),
		),
		'singular'       => array(
			'title'       => _x( 'Singular', 'Template name', 'gutenberg' ),
			'description' => __( 'Used when a single entry is queried. This template will be overridden the Single, Post, and Page templates where appropriate', 'gutenberg' ),
		),
		'single'         => array(
			'title'       => _x( 'Single', 'Template name', 'gutenberg' ),
			'description' => __( 'Used when a single entry that is not a Page is queried', 'gutenberg' ),
		),
		'single-post'    => array(
			'title'       => _x( 'Post', 'Template name', 'gutenberg' ),
			'description' => __( 'Used when a single Post is queried', 'gutenberg' ),
		),
		'page'           => array(
			'title'       => _x( 'Page', 'Template name', 'gutenberg' ),
			'description' => __( 'Used when an individual Page is queried', 'gutenberg' ),
		),
		'archive'        => array(
			'title'       => _x( 'Archive', 'Template name', 'gutenberg' ),
			'description' => __( 'Used when multiple entries are queried. This template will be overridden the Category, Author, and Date templates where appropriate', 'gutenberg' ),
		),
		'author'         => array(
			'title'       => _x( 'Author Archive', 'Template name', 'gutenberg' ),
			'description' => __( 'Used when a list of Posts from a single author is queried', 'gutenberg' ),
		),
		'category'       => array(
			'title'       => _x( 'Post Category Archive', 'Template name', 'gutenberg' ),
			'description' => __( 'Used when a list of Posts from a category is queried', 'gutenberg' ),
		),
		'taxonomy'       => array(
			'title'       => _x( 'Taxonomy Archive', 'Template name', 'gutenberg' ),
			'description' => __( 'Used when a list of posts from a taxonomy is queried', 'gutenberg' ),
		),
		'date'           => array(
			'title'       => _x( 'Date Archive', 'Template name', 'gutenberg' ),
			'description' => __( 'Used when a list of Posts from a certain date are queried', 'gutenberg' ),
		),
		'tag'            => array(
			'title'       => _x( 'Tag Archive', 'Template name', 'gutenberg' ),
			'description' => __( 'Used when a list of Posts with a certain tag is queried', 'gutenberg' ),
		),
		'attachment'     => array(
			'title'       => __( 'Media', 'gutenberg' ),
			'description' => __( 'Used when a Media entry is queried', 'gutenberg' ),
		),
		'search'         => array(
			'title'       => _x( 'Search Results', 'Template name', 'gutenberg' ),
			'description' => __( 'Used when a visitor searches the site', 'gutenberg' ),
		),
		'privacy-policy' => array(
			'title'       => __( 'Privacy Policy', 'gutenberg' ),
			'description' => '',
		),
		'404'            => array(
			'title'       => _x( '404', 'Template name', 'gutenberg' ),
			'description' => __( 'Used when the queried content cannot be found', 'gutenberg' ),
		),
	);

	/**
	 * Filters the list of template types.
	 *
	 * @param array $default_template_types An array of template types, formatted as [ slug => [ title, description ] ].
	 *
	 * @since 5.x.x
	 */
	return apply_filters( 'default_template_types', $default_template_types );
}

/**
 * Converts the default template types array from associative to indexed,
 * to be used in JS, where numeric keys (e.g. '404') always appear before alphabetical
 * ones, regardless of the actual order of the array.
 *
 * From slug-keyed associative array:
 * `[ 'index' => [ 'title' => 'Index', 'description' => 'Index template' ] ]`
 *
 * ...to indexed array with slug as property:
 * `[ [ 'slug' => 'index', 'title' => 'Index', 'description' => 'Index template' ] ]`
 *
 * @return array The default template types as an indexed array.
 */
function gutenberg_get_indexed_default_template_types() {
	$indexed_template_types = array();
	$default_template_types = gutenberg_get_default_template_types();
	foreach ( $default_template_types as $slug => $template_type ) {
		$template_type['slug']    = (string) $slug;
		$indexed_template_types[] = $template_type;
	}
	return $indexed_template_types;
}

/**
 * Return a list of all overrideable default template type slugs.
 *
 * @see get_query_template
 *
 * @return string[] List of all overrideable default template type slugs.
 */
function gutenberg_get_template_type_slugs() {
	return array_keys( gutenberg_get_default_template_types() );
}
