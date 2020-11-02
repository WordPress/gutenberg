<?php
/**
 * Block template loader functions.
 *
 * @package gutenberg
 */

/**
 * Return a list of all overrideable default template types.
 *
 * @see get_query_template
 *
 * @return string[] List of all overrideable default template types.
 */
function get_template_types() {
	return array(
		'index',
		'404',
		'archive',
		'author',
		'category',
		'tag',
		'taxonomy',
		'date',
		'embed',
		'home',
		'front-page',
		'privacy-policy',
		'page',
		'search',
		'single',
		'singular',
		'attachment',
	);
}

/**
 * Adds necessary filters to use 'wp_template' posts instead of theme template files.
 */
function gutenberg_add_template_loader_filters() {
	if ( ! gutenberg_is_fse_theme() ) {
		return;
	}

	foreach ( get_template_types() as $template_type ) {
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
	if ( ! in_array( $template_type, get_template_types(), true ) ) {
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

	$current_template = gutenberg_find_template_post_and_parts( $type, $templates );

	if ( $current_template ) {
		$_wp_current_template_content = empty( $current_template['template_post']->post_content ) ? __( 'Empty template.', 'gutenberg' ) : $current_template['template_post']->post_content;

		if ( isset( $_GET['_wp-find-template'] ) ) {
			wp_send_json_success( $current_template['template_post'] );
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
 * Recursively traverses a block tree, creating auto drafts
 * for any encountered template parts without a fixed post.
 *
 * @access private
 *
 * @param array $block The root block to start traversing from.
 * @return int[] A list of template parts IDs for the given block.
 */
function create_auto_draft_for_template_part_block( $block ) {
	$template_part_ids = array();

	if ( 'core/template-part' === $block['blockName'] && isset( $block['attrs']['slug'] ) ) {
		if ( isset( $block['attrs']['postId'] ) ) {
			// Template part is customized.
			$template_part_id = $block['attrs']['postId'];
		} else {
			// A published post might already exist if this template part
			// was customized elsewhere or if it's part of a customized
			// template. We also check if an auto-draft was already created
			// because preloading can make this run twice, so, different code
			// paths can end up with different posts for the same template part.
			// E.g. The server could send back post ID 1 to the client, preload,
			// and create another auto-draft. So, if the client tries to resolve the
			// post ID from the slug and theme, it won't match with what the server sent.
			$template_part_query = new WP_Query(
				array(
					'post_type'      => 'wp_template_part',
					'post_status'    => array( 'publish', 'auto-draft' ),
					'title'          => $block['attrs']['slug'],
					'meta_key'       => 'theme',
					'meta_value'     => $block['attrs']['theme'],
					'posts_per_page' => 1,
					'no_found_rows'  => true,
				)
			);
			$template_part_post  = $template_part_query->have_posts() ? $template_part_query->next_post() : null;
			if ( $template_part_post && 'auto-draft' !== $template_part_post->post_status ) {
				$template_part_id = $template_part_post->ID;
			} else {
				// Template part is not customized, get it from a file and make an auto-draft for it, unless one already exists
				// and the underlying file hasn't changed.
				$template_part_file_path = get_stylesheet_directory() . '/block-template-parts/' . $block['attrs']['slug'] . '.html';
				if ( ! file_exists( $template_part_file_path ) ) {
					$template_part_file_path = false;
				}

				if ( $template_part_file_path ) {
					$file_contents = file_get_contents( $template_part_file_path );
					if ( $template_part_post && $template_part_post->post_content === $file_contents ) {
						$template_part_id = $template_part_post->ID;
					} else {
						$template_part_id = wp_insert_post(
							array(
								'post_content' => $file_contents,
								'post_title'   => $block['attrs']['slug'],
								'post_status'  => 'auto-draft',
								'post_type'    => 'wp_template_part',
								'post_name'    => $block['attrs']['slug'],
								'meta_input'   => array(
									'theme' => $block['attrs']['theme'],
								),
							)
						);
					}
				}
			}
		}
		$template_part_ids[ $block['attrs']['slug'] ] = $template_part_id;
	}

	foreach ( $block['innerBlocks'] as $inner_block ) {
		$template_part_ids = array_merge( $template_part_ids, create_auto_draft_for_template_part_block( $inner_block ) );
	}
	return $template_part_ids;
}

/**
 * Return the correct 'wp_template' post and template part IDs for the current template.
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
function gutenberg_find_template_post_and_parts( $template_type, $template_hierarchy = array() ) {
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

	// Find most specific 'wp_template' post matching the hierarchy.
	$template_query = new WP_Query(
		array(
			'post_type'      => 'wp_template',
			'post_status'    => 'publish',
			'post_name__in'  => $slugs,
			'orderby'        => 'post_name__in',
			'posts_per_page' => 1,
			'no_found_rows'  => true,
		)
	);

	$current_template_post = $template_query->have_posts() ? $template_query->next_post() : null;

	// Build map of template slugs to their priority in the current hierarchy.
	$slug_priorities = array_flip( $slugs );

	// See if there is a theme block template with higher priority than the resolved template post.
	$higher_priority_block_template_path     = null;
	$higher_priority_block_template_priority = PHP_INT_MAX;
	$block_template_files                    = gutenberg_get_template_paths();
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
		$file_contents         = file_get_contents( $higher_priority_block_template_path );
		$current_template_post = array(
			'post_content' => $file_contents,
			'post_title'   => $post_name,
			'post_status'  => 'auto-draft',
			'post_type'    => 'wp_template',
			'post_name'    => $post_name,
		);
		if ( is_admin() || defined( 'REST_REQUEST' ) ) {
			$template_query        = new WP_Query(
				array(
					'post_type'      => 'wp_template',
					'post_status'    => 'auto-draft',
					'name'           => $post_name,
					'posts_per_page' => 1,
					'no_found_rows'  => true,
				)
			);
			$current_template_post = $template_query->have_posts() ? $template_query->next_post() : $current_template_post;

			// Only create auto-draft of block template for editing
			// in admin screens, when necessary, because the underlying
			// file has changed.
			if ( is_array( $current_template_post ) || $current_template_post->post_content !== $file_contents ) {
				if ( ! is_array( $current_template_post ) ) {
					$current_template_post->post_content = $file_contents;
				}
				$current_template_post = get_post(
					wp_insert_post( $current_template_post )
				);
			}
		} else {
			$current_template_post = new WP_Post(
				(object) $current_template_post
			);
		}
	}

	// If we haven't found any template post by here, it means that this theme doesn't even come with a fallback
	// `index.html` block template. We create one so that people that are trying to access the editor are greeted
	// with a blank page rather than an error.
	if ( ! $current_template_post && ( is_admin() || defined( 'REST_REQUEST' ) ) ) {
		$current_template_post = array(
			'post_title'  => 'index',
			'post_status' => 'auto-draft',
			'post_type'   => 'wp_template',
			'post_name'   => 'index',
		);
		$current_template_post = get_post(
			wp_insert_post( $current_template_post )
		);
	}

	if ( $current_template_post ) {
		$template_part_ids = array();
		if ( is_admin() || defined( 'REST_REQUEST' ) ) {
			foreach ( parse_blocks( $current_template_post->post_content ) as $block ) {
				$template_part_ids = array_merge( $template_part_ids, create_auto_draft_for_template_part_block( $block ) );
			}
		}
		return array(
			'template_post'     => $current_template_post,
			'template_part_ids' => $template_part_ids,
		);
	}
	return null;
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
 * Extends default editor settings to enable template and template part editing.
 *
 * @param array $settings Default editor settings.
 *
 * @return array Filtered editor settings.
 */
function gutenberg_template_loader_filter_block_editor_settings( $settings ) {
	global $post;

	if ( ! $post ) {
		return $settings;
	}

	// If this is the Site Editor, auto-drafts for template parts have already been generated
	// through `filter_rest_wp_template_part_query`, when called via the REST API.
	if ( isset( $settings['editSiteInitialState'] ) ) {
		return $settings;
	}

	// Otherwise, create template part auto-drafts for the edited post.
	$post = get_post();
	foreach ( parse_blocks( $post->post_content ) as $block ) {
		create_auto_draft_for_template_part_block( $block );
	}

	// TODO: Set editing mode and current template ID for editing modes support.
	return $settings;
}
add_filter( 'block_editor_settings', 'gutenberg_template_loader_filter_block_editor_settings' );

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
