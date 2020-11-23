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
		'front-page'     => array(
			'title'       => _x( 'Front Page', 'Template name', 'gutenberg' ),
			'description' => __( 'Resolves when the site home page is requested', 'gutenberg' ),
		),
		'single-post'    => array(
			'title'       => _x( 'Post', 'Template name', 'gutenberg' ),
			'description' => __( 'Resolves when a post is requested', 'gutenberg' ),
		),
		'page'           => array(
			'title'       => _x( 'Page', 'Template name', 'gutenberg' ),
			'description' => __( 'Resolves when a page is requested', 'gutenberg' ),
		),
		'archive'        => array(
			'title'       => _x( 'Archive', 'Template name', 'gutenberg' ),
			'description' => __( 'Resolves when archives like post categories are requested', 'gutenberg' ),
		),
		'search'         => array(
			'title'       => _x( 'Search Results', 'Template name', 'gutenberg' ),
			'description' => __( 'Resolves when a visitor searches the site', 'gutenberg' ),
		),
		'404'            => array(
			'title'       => _x( '404', 'Template name', 'gutenberg' ),
			'description' => __( 'Resolves when the requested content cannot be found', 'gutenberg' ),
		),
		'index'          => array(
			'title'       => _x( 'Index', 'Template name', 'gutenberg' ),
			'description' => __( 'Resolves when no other template can be found', 'gutenberg' ),
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
