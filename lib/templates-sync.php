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
			'post_name__in'  => array( $slug ),
			'tax_query'      => array(
				array(
					'taxonomy' => 'wp_theme',
					'field'    => 'slug',
					'terms'    => $theme,
				),
			),
			'posts_per_page' => 1,
			'no_found_rows'  => true,
		)
	);
	$post           = $template_query->have_posts() ? $template_query->next_post() : null;
	if ( ! $post ) {
		$template_post = array(
			'post_content' => $content,
			'post_title'   => $slug,
			'post_status'  => 'auto-draft',
			'post_type'    => $post_type,
			'post_name'    => $slug,
			'tax_input'    => array( 'wp_theme' => array( $theme, '_wp_file_based' ) ),
		);

		if ( 'wp_template' === $post_type ) {
			$default_template_types = gutenberg_get_default_template_types();
			if ( isset( $default_template_types[ $slug ] ) ) {
				$template_post['post_title']   = $default_template_types[ $slug ]['title'];
				$template_post['post_excerpt'] = $default_template_types[ $slug ]['description'];
			}
		}

		wp_insert_post( $template_post );
	} elseif ( 'auto-draft' === $post->post_status && $content !== $post->post_content ) {
		// If the template already exists, but it was never changed by the user
		// and the template file content changed then update the content of auto-draft.
		$post->post_content = $content;
		wp_insert_post( $post );
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
	$themes              = array(
		get_stylesheet() => get_stylesheet_directory(),
		get_template()   => get_template_directory(),
	);

	// Get file paths for all theme supplied template that changed since last check.
	$template_files = array();
	$option_name    = 'gutenberg_last_synchronize_theme_' . $template_type . '_checks';
	$last_checks    = get_option( $option_name, array() );
	$current_time   = time();
	foreach ( $themes as $theme_slug => $theme_dir ) {
		$last_check = isset( $last_checks[ $theme_slug ] ) ? $last_checks[ $theme_slug ] : 0;

		$theme_template_files = _gutenberg_get_template_paths( $theme_dir . '/' . $template_base_paths[ $template_type ] );
		foreach ( $theme_template_files as $template_file ) {
			if ( filemtime( $template_file ) > $last_check ) {
				$template_files[] = array(
					'path'  => $template_file,
					'theme' => $theme_slug,
				);
			}
		}

		$last_checks[ $theme_slug ] = $current_time;
	}

	// Build and save each template part.
	foreach ( $template_files as $template_file ) {
		$path               = $template_file['path'];
		$theme              = $template_file['theme'];
		$template_base_path = $template_base_paths[ $template_type ];

		$content = file_get_contents( $path );
		$slug    = substr(
			$path,
			// Starting position of slug.
			strpos( $path, $template_base_path . DIRECTORY_SEPARATOR ) + 1 + strlen( $template_base_path ),
			// Subtract ending '.html'.
			-5
		);
		_gutenberg_create_auto_draft_for_template( $template_post_types[ $template_type ], $slug, $theme, $content );
	}

	update_option( $option_name, $last_checks );
}

/**
 * Synchronize changed template and template part files after WordPress is loaded
 */
function gutenberg_synchronize_theme_templates_on_load() {
	if ( ! gutenberg_is_fse_theme() ) {
		return;
	}

	_gutenberg_synchronize_theme_templates( 'template-part' );
	_gutenberg_synchronize_theme_templates( 'template' );
}
add_action( 'wp_loaded', 'gutenberg_synchronize_theme_templates_on_load' );

/**
 * Clears synchronization last check timestamps.
 */
function gutenberg_clear_synchronize_last_checks() {
	update_option( 'gutenberg_last_synchronize_theme_template_checks', array() );
	update_option( 'gutenberg_last_synchronize_theme_template-part_checks', array() );
}

// Clear synchronization last check timestamps after trashing a template or template part.
add_action( 'trash_wp_template', 'gutenberg_clear_synchronize_last_checks' );
add_action( 'trash_wp_template_part', 'gutenberg_clear_synchronize_last_checks' );

/**
 * Clear synchronization last check timestamps after deleting a template or template part.
 *
 * @param int     $post_id ID of the deleted post.
 * @param WP_Post $post WP_Post instance of the deleted post.
 */
function gutenberg_clear_synchronize_last_checks_after_delete( $post_id, $post ) {
	if ( 'wp_template' === $post->post_type || 'wp_template_part' === $post->post_type ) {
		gutenberg_clear_synchronize_last_checks();
	}
}
add_action( 'after_delete_post', 'gutenberg_clear_synchronize_last_checks_after_delete', 10, 2 );
