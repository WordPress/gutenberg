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
	if ( ! post_type_exists( 'wp_template' ) ) {
		return;
	}

	/**
	 * Array of all overrideable default template types.
	 *
	 * @see get_query_template
	 *
	 * @var array
	 */
	$template_types = array(
		'index',
		'404',
		'archive',
		'author',
		'category',
		'tag',
		'taxonomy',
		'date',
		// Skip 'embed' for now because it is not a regular template type.
		'home',
		'frontpage',
		'privacypolicy',
		'page',
		'search',
		'single',
		'singular',
		'attachment',
	);
	foreach ( $template_types as $template_type ) {
		add_filter( $template_type . '_template', 'gutenberg_override_query_template', 20, 3 );
	}

	add_filter( 'template_include', 'gutenberg_find_template', 20 );
}
add_action( 'wp_loaded', 'gutenberg_add_template_loader_filters' );

/**
 * Filters into the "{$type}_template" hooks to record the current template hierarchy.
 *
 * The method returns an empty result for every template so that a 'wp_template' post
 * is used instead.
 *
 * @see gutenberg_find_template
 *
 * @param string $template  Path to the template. See locate_template().
 * @param string $type      Sanitized filename without extension.
 * @param array  $templates A list of template candidates, in descending order of priority.
 * @return string Empty string to ensure template file is considered not found.
 */
function gutenberg_override_query_template( $template, $type, array $templates = array() ) {
	global $_wp_current_template_hierarchy;

	if ( ! is_array( $_wp_current_template_hierarchy ) ) {
		$_wp_current_template_hierarchy = $templates;
	} else {
		$_wp_current_template_hierarchy = array_merge( $_wp_current_template_hierarchy, $templates );
	}

	return '';
}

/**
 * Recursively traverses a block tree, creating auto drafts
 * for any encountered template parts without a fixed post.
 *
 * @access private
 *
 * @param array $block The root block to start traversing from.
 */
function create_auto_draft_for_template_part_block( $block ) {
	if ( 'core/template-part' === $block['blockName'] && ! isset( $block['attrs']['id'] ) ) {
		$template_part_file_path =
			get_stylesheet_directory() . '/block-template-parts/' . $block['attrs']['slug'] . '.html';
		if ( ! file_exists( $template_part_file_path ) ) {
			return;
		}
		wp_insert_post(
			array(
				'post_content' => file_get_contents( $template_part_file_path ),
				'post_title'   => ucfirst( $block['attrs']['slug'] ),
				'post_status'  => 'auto-draft',
				'post_type'    => 'wp_template_part',
				'post_name'    => $block['attrs']['slug'],
				'meta_input'   => array(
					'theme' => $block['attrs']['theme'],
				),
			)
		);
	}

	foreach ( $block['innerBlocks'] as $inner_block ) {
		create_auto_draft_for_template_part_block( $inner_block );
	}
}

/**
 * Find the correct 'wp_template' post for the current hierarchy and return the path
 * to the canvas file that will render it.
 *
 * @param string $template_file Original template file. Will be overridden.
 * @return string Path to the canvas file to include.
 */
function gutenberg_find_template( $template_file ) {
	global $_wp_current_template_id, $_wp_current_template_content, $_wp_current_template_hierarchy;

	// Bail if no relevant template hierarchy was determined, or if the template file
	// was overridden another way.
	if ( ! $_wp_current_template_hierarchy || $template_file ) {
		return $template_file;
	}

	$slugs = array_map(
		'gutenberg_strip_php_suffix',
		$_wp_current_template_hierarchy
	);

	// Find most specific 'wp_template' post matching the hierarchy.
	$template_query = new WP_Query(
		array(
			'post_type'      => 'wp_template',
			'post_status'    => 'publish',
			'post_name__in'  => $slugs,
			'orderby'        => 'post_name__in',
			'posts_per_page' => 1,
		)
	);

	$template_posts        = $template_query->get_posts();
	$current_template_post = array_shift( $template_posts );

	// Build map of template slugs to their priority in the current hierarchy.
	$slug_priorities = array_flip( $slugs );

	// See if there is a theme block template with higher priority than the resolved template post.
	$higher_priority_block_template_path     = null;
	$higher_priority_block_template_priority = PHP_INT_MAX;
	$block_template_files                    = glob( get_stylesheet_directory() . '/block-templates/*.html' ) ?: array();
	if ( is_child_theme() ) {
		$block_template_files = array_merge( $block_template_files, glob( get_template_directory() . '/block-templates/*.html' ) ?: array() );
	}
	if ( gutenberg_is_experiment_enabled( 'gutenberg-full-site-editing-demo' ) ) {
		$block_template_files = array_merge( $block_template_files, glob( dirname( __FILE__ ) . '/demo-block-templates/*.html' ) ?: array() );
	}
	foreach ( $block_template_files as $path ) {
		if ( ! isset( $slug_priorities[ basename( $path, '.html' ) ] ) ) {
			continue;
		}
		$theme_block_template_priority = $slug_priorities[ basename( $path, '.html' ) ];
		if (
			$theme_block_template_priority < $higher_priority_block_template_priority &&
			( empty( $current_template_post ) || $theme_block_template_priority < $slug_priorities[ $current_template_post->post_name ] )
		) {
			$higher_priority_block_template_path     = $path;
			$higher_priority_block_template_priority = $theme_block_template_priority;
		}
	}

	// If there is, use it instead.
	if ( isset( $higher_priority_block_template_path ) ) {
		$post_name             = basename( $higher_priority_block_template_path, '.html' );
		$current_template_post = array(
			'post_content' => file_get_contents( $higher_priority_block_template_path ),
			'post_title'   => ucfirst( $post_name ),
			'post_status'  => 'auto-draft',
			'post_type'    => 'wp_template',
			'post_name'    => $post_name,
		);
		if ( is_admin() ) {
			// Only create auto-draft of block template for editing
			// in admin screens, similarly to how we do it for new
			// posts in the editor.
			$current_template_post = get_post(
				wp_insert_post( $current_template_post )
			);
		} else {
			$current_template_post = new WP_Post(
				(object) $current_template_post
			);
		}
	}

	if ( $current_template_post ) {
		if ( is_admin() ) {
			foreach ( parse_blocks( $current_template_post->post_content ) as $block ) {
				create_auto_draft_for_template_part_block( $block );
			}
		}
		$_wp_current_template_id      = $current_template_post->ID;
		$_wp_current_template_content = $current_template_post->post_content;
	}

	// Add extra hooks for template canvas.
	add_action( 'wp_head', 'gutenberg_viewport_meta_tag', 0 );
	remove_action( 'wp_head', '_wp_render_title_tag', 1 );
	add_action( 'wp_head', 'gutenberg_render_title_tag', 1 );

	// This file will be included instead of the theme's template file.
	return gutenberg_dir_path() . 'lib/template-canvas.php';
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
	$content = wp_make_content_images_responsive( $content );
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
 * Extends default editor settings to enable template and template part editing.
 *
 * @param array $settings Default editor settings.
 *
 * @return array Filtered editor settings.
 */
function gutenberg_template_loader_filter_block_editor_settings( $settings ) {
	if ( ! post_type_exists( 'wp_template' ) || ! post_type_exists( 'wp_template_part' ) ) {
		return $settings;
	}

	// Create template part auto-drafts for the edited post.
	foreach ( parse_blocks( get_post()->post_content ) as $block ) {
		create_auto_draft_for_template_part_block( $block );
	}

	// TODO: Set editing mode and current template ID for editing modes support.
	return $settings;
}
add_filter( 'block_editor_settings', 'gutenberg_template_loader_filter_block_editor_settings' );
