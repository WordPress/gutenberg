<?php
/**
 * Block template loader functions.
 *
 * @package gutenberg
 */

/**
 * Adds necessary filters to use 'wp_template' posts instead of theme template files.
 */
function gutenberg_add_template_loader_filters() {
	if ( ! gutenberg_is_fse_theme() ) {
		return;
	}

	foreach ( gutenberg_get_template_type_slugs() as $template_type ) {
		if ( 'embed' === $template_type ) { // Skip 'embed' for now because it is not a regular template type.
			continue;
		}
		add_filter( str_replace( '-', '', $template_type ) . '_template', 'gutenberg_override_query_template', 20, 3 );
	}
}
add_action( 'wp_loaded', 'gutenberg_add_template_loader_filters' );

/**
 * Get the template hierarchy for a given template type.
 *
 * Internally, this filters into the "{$type}_template_hierarchy" hook to record the type-specific template hierarchy.
 *
 * @param string $template_type A template type.
 * @return string[] A list of template candidates, in descending order of priority.
 */
function get_template_hierarchy( $template_type ) {
	if ( ! in_array( $template_type, gutenberg_get_template_type_slugs(), true ) ) {
		return array();
	}

	$get_template_function     = 'get_' . str_replace( '-', '_', $template_type ) . '_template'; // front-page -> get_front_page_template.
	$template_hierarchy_filter = str_replace( '-', '', $template_type ) . '_template_hierarchy'; // front-page -> frontpage_template_hierarchy.

	$result                             = array();
	$template_hierarchy_filter_function = function( $templates ) use ( &$result ) {
		$result = $templates;
		return $templates;
	};

	add_filter( $template_hierarchy_filter, $template_hierarchy_filter_function, 20, 1 );
	call_user_func( $get_template_function ); // This invokes template_hierarchy_filter.
	remove_filter( $template_hierarchy_filter, $template_hierarchy_filter_function, 20 );

	return $result;
}

/**
 * Filters into the "{$type}_template" hooks to redirect them to the Full Site Editing template canvas.
 *
 * Internally, this communicates the block content that needs to be used by the template canvas through a global variable.
 *
 * @param string $template  Path to the template. See locate_template().
 * @param string $type      Sanitized filename without extension.
 * @param array  $templates A list of template candidates, in descending order of priority.
 * @return string The path to the Full Site Editing template canvas file.
 */
function gutenberg_override_query_template( $template, $type, array $templates = array() ) {
	global $_wp_current_template_content;

	$current_template = gutenberg_resolve_template( $type, $templates );

	if ( $current_template ) {
		$_wp_current_template_content = empty( $current_template->post_content ) ? __( 'Empty template.', 'gutenberg' ) : $current_template->post_content;

		if ( isset( $_GET['_wp-find-template'] ) ) {
			wp_send_json_success( $current_template );
		}
	} else {
		if ( 'index' === $type ) {
			if ( isset( $_GET['_wp-find-template'] ) ) {
				wp_send_json_error( array( 'message' => __( 'No matching template found.', 'gutenberg' ) ) );
			}
		} else {
			return false; // So that the template loader keeps looking for templates.
		}
	}

	// Add hooks for template canvas.
	// Add viewport meta tag.
	add_action( 'wp_head', 'gutenberg_viewport_meta_tag', 0 );

	// Render title tag with content, regardless of whether theme has title-tag support.
	remove_action( 'wp_head', '_wp_render_title_tag', 1 );    // Remove conditional title tag rendering...
	add_action( 'wp_head', 'gutenberg_render_title_tag', 1 ); // ...and make it unconditional.

	// This file will be included instead of the theme's template file.
	return gutenberg_dir_path() . 'lib/template-canvas.php';
}

/**
 * Return the correct 'wp_template' to render fot the request template type.
 *
 * Accepts an optional $template_hierarchy argument as a hint.
 *
 * @param string   $template_type      The current template type.
 * @param string[] $template_hierarchy (optional) The current template hierarchy, ordered by priority.
 * @return null|array {
 *  @type WP_Post|null template_post A template post object, or null if none could be found.
 *  @type int[] A list of template parts IDs for the template.
 * }
 */
function gutenberg_resolve_template( $template_type, $template_hierarchy = array() ) {
	if ( ! $template_type ) {
		return null;
	}

	if ( empty( $template_hierarchy ) ) {
		if ( 'index' === $template_type ) {
			$template_hierarchy = get_template_hierarchy( 'index' );
		} else {
			$template_hierarchy = array_merge( get_template_hierarchy( $template_type ), get_template_hierarchy( 'index' ) );
		}
	}

	$slugs = array_map(
		'gutenberg_strip_php_suffix',
		$template_hierarchy
	);

	// Find all potential templates 'wp_template' post matching the hierarchy.
	$template_query = new WP_Query(
		array(
			'post_type'      => 'wp_template',
			'post_status'    => array( 'publish', 'auto-draft' ),
			'post_name__in'  => $slugs,
			'orderby'        => 'post_name__in',
			'posts_per_page' => -1,
			'no_found_rows'  => true,
			'tax_query'      => array(
				array(
					'taxonomy' => 'wp_theme',
					'field'    => 'slug',
					'terms'    => wp_get_theme()->get_stylesheet(),
				),
			),
		)
	);
	$templates      = $template_query->get_posts();

	// Order these templates per slug priority.
	// Build map of template slugs to their priority in the current hierarchy.
	$slug_priorities = array_flip( $slugs );

	usort(
		$templates,
		function ( $template_a, $template_b ) use ( $slug_priorities ) {
			return $slug_priorities[ $template_a->post_name ] - $slug_priorities[ $template_b->post_name ];
		}
	);

	return count( $templates ) ? $templates[0] : null;
}

/**
 * Displays title tag with content, regardless of whether theme has title-tag support.
 *
 * @see _wp_render_title_tag()
 */
function gutenberg_render_title_tag() {
	echo '<title>' . wp_get_document_title() . '</title>' . "\n";
}

/**
 * Renders the markup for the current template.
 */
function gutenberg_render_the_template() {
	global $_wp_current_template_content;
	global $wp_embed;

	if ( ! $_wp_current_template_content ) {
		echo '<h1>' . esc_html__( 'No matching template found', 'gutenberg' ) . '</h1>';
		return;
	}

	$content = $wp_embed->run_shortcode( $_wp_current_template_content );
	$content = $wp_embed->autoembed( $content );
	$content = do_blocks( $content );
	$content = wptexturize( $content );
	if ( function_exists( 'wp_filter_content_tags' ) ) {
		$content = wp_filter_content_tags( $content );
	} else {
		$content = wp_make_content_images_responsive( $content );
	}
	$content = str_replace( ']]>', ']]&gt;', $content );

	// Wrap block template in .wp-site-blocks to allow for specific descendant styles
	// (e.g. `.wp-site-blocks > *`).
	echo '<div class="wp-site-blocks">';
	echo $content; // phpcs:ignore WordPress.Security.EscapeOutput
	echo '</div>';
}

/**
 * Renders a 'viewport' meta tag.
 *
 * This is hooked into {@see 'wp_head'} to decouple its output from the default template canvas.
 */
function gutenberg_viewport_meta_tag() {
	echo '<meta name="viewport" content="width=device-width, initial-scale=1" />' . "\n";
}

/**
 * Strips .php suffix from template file names.
 *
 * @access private
 *
 * @param string $template_file Template file name.
 * @return string Template file name without extension.
 */
function gutenberg_strip_php_suffix( $template_file ) {
	return preg_replace( '/\.php$/', '', $template_file );
}

/**
 * Removes post details from block context when rendering a block template.
 *
 * @param array $context Default context.
 *
 * @return array Filtered context.
 */
function gutenberg_template_render_without_post_block_context( $context ) {
	/*
	 * When loading a template or template part directly and not through a page
	 * that resolves it, the top-level post ID and type context get set to that
	 * of the template part. Templates are just the structure of a site, and
	 * they should not be available as post context because blocks like Post
	 * Content would recurse infinitely.
	 */
	if ( isset( $context['postType'] ) &&
			( 'wp_template' === $context['postType'] || 'wp_template_part' === $context['postType'] ) ) {
		unset( $context['postId'] );
		unset( $context['postType'] );
	}

	return $context;
}
add_filter( 'render_block_context', 'gutenberg_template_render_without_post_block_context' );
