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
			'description' => __( 'Displays latest posts.', 'gutenberg' ),
		),
		'home'           => array(
			'title'       => _x( 'Home', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays latest posts when the homepage is set to display latest posts.', 'gutenberg' ),
		),
		'front-page'     => array(
			'title'       => _x( 'Front Page', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays when a user visits the site home page.', 'gutenberg' ),
		),
		'singular'       => array(
			'title'       => _x( 'Singular', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays a single post or page.', 'gutenberg' ),
		),
		'single'         => array(
			'title'       => _x( 'Single Post', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays a single post.', 'gutenberg' ),
		),
		'page'           => array(
			'title'       => _x( 'Page', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays individual pages.', 'gutenberg' ),
		),
		'archive'        => array(
			'title'       => _x( 'Archive', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays post categories, tags, and other archives.', 'gutenberg' ),
		),
		'author'         => array(
			'title'       => _x( 'Author', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays latest posts written by a single author.', 'gutenberg' ),
		),
		'category'       => array(
			'title'       => _x( 'Category', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays latest posts from a single post category.', 'gutenberg' ),
		),
		'taxonomy'       => array(
			'title'       => _x( 'Taxonomy', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays latest posts from a single post taxonomy.', 'gutenberg' ),
		),
		'date'           => array(
			'title'       => _x( 'Date', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays posts from a specific date.', 'gutenberg' ),
		),
		'tag'            => array(
			'title'       => _x( 'Tag', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays latest posts from a single post tag.', 'gutenberg' ),
		),
		'attachment'     => array(
			'title'       => __( 'Media', 'gutenberg' ),
			'description' => __( 'Displays individual media items or attachments.', 'gutenberg' ),
		),
		'search'         => array(
			'title'       => _x( 'Search', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays search results.', 'gutenberg' ),
		),
		'privacy-policy' => array(
			'title'       => __( 'Privacy Policy', 'gutenberg' ),
			'description' => 'Displays the privacy policy page.',
		),
		'404'            => array(
			'title'       => _x( '404', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays when no content is found.', 'gutenberg' ),
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
