<?php
/**
 * Block templates and template parts auto-draft synchronization utils.
 *
 * @package gutenberg
 */

/**
 * Creates a template (or template part depending on the post type)
 * auto-draft if it doesn't exist yet.
 *
 * @access private
 * @internal
 *
 * @param string $post_type Template post type.
 * @param string $slug      Template slug.
 * @param string $theme     Template theme.
 * @param string $content   Template content.
 */
function _gutenberg_create_auto_draft_for_template( $post_type, $slug, $theme, $content ) {
	// We check if an auto-draft was already created,
	// before running the REST API calls
	// because the site editor needs an existing auto-draft
	// for each theme template part to work properly.
	$template_query = new WP_Query(
		array(
			'post_type'      => $post_type,
			'post_status'    => array( 'publish', 'auto-draft' ),
			'title'          => $slug,
			'meta_key'       => 'theme',
			'meta_value'     => $theme,
			'posts_per_page' => 1,
			'no_found_rows'  => true,
		)
	);
	$post           = $template_query->have_posts() ? $template_query->next_post() : null;
	if ( ! $post ) {
		wp_insert_post(
			array(
				'post_content' => $content,
				'post_title'   => $slug,
				'post_status'  => 'auto-draft',
				'post_type'    => $post_type,
				'post_name'    => $slug,
			)
		);
	} else {
		// Potentially we could decide to update the content if different.
	}
}

/**
 * Finds all nested template part file paths in a theme's directory.
 *
 * @access private
 *
 * @param string $base_directory The theme's file path.
 * @return array $path_list A list of paths to all template part files.
 */
function _gutenberg_get_template_paths( $base_directory ) {
	$path_list = array();
	if ( file_exists( $base_directory ) ) {
		$nested_files      = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $base_directory ) );
		$nested_html_files = new RegexIterator( $nested_files, '/^.+\.html$/i', RecursiveRegexIterator::GET_MATCH );
		foreach ( $nested_html_files as $path => $file ) {
			$path_list[] = $path;
		}
	}
	return $path_list;
}

/**
 * Create the template parts auto-drafts for the current theme.
 *
 * @access private
 * @internal
 *
 * @param string $template_type The template type (template or template-part).
 */
function _gutenberg_synchronize_theme_templates( $template_type ) {
	$template_post_types = array(
		'template'      => 'wp_template',
		'template-part' => 'wp_template_part',
	);
	$template_base_paths = array(
		'template'      => 'block-templates',
		'template-part' => 'block-template-parts',
	);

	// Get file paths for all theme supplied template.
	$template_files = _gutenberg_get_template_paths( get_stylesheet_directory() . '/' . $template_base_paths[ $template_type ] );
	if ( is_child_theme() ) {
		$template_files = array_merge( $template_files, _gutenberg_get_template_paths( get_template_directory() . '/' . $template_base_paths[ $template_type ] ) );
	}

	// Build and save each template part.
	foreach ( $template_files as $template_file ) {
		$content = file_get_contents( $template_file );
		$slug    = substr(
			$template_file,
			// Starting position of slug.
			strpos( $template_file, $template_base_paths[ $template_type ] . '/' ) + 1 + strlen( $template_base_paths[ $template_type ] ),
			// Subtract ending '.html'.
			-5
		);
		_gutenberg_create_auto_draft_for_template( $template_post_types[ $template_type ], $slug, wp_get_theme()->get_stylesheet(), $content );
	}
}
