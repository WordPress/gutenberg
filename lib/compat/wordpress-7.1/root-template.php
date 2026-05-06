<?php
/**
 * Root template feature.
 *
 * If the active theme provides a `root.html` template, every block template
 * resolved by the WordPress template hierarchy is wrapped inside it. The
 * originally-resolved template id is stashed in a global so the
 * `core/template-content` block can resolve and render it.
 *
 * @package gutenberg
 */

/**
 * Returns the active theme's root block template, or null if none exists.
 *
 * Caches the result for the duration of the request. `get_block_template()`
 * checks both the `wp_template` post type (user customizations) and theme
 * files, so this works for either source.
 *
 * Pass `true` to reset the cache. Useful when root has been created, deleted,
 * or saved during the same request and a subsequent render needs the fresh
 * value (e.g. previewing edits made in the Site Editor without a full page
 * reload). Cleared automatically when any `wp_template` post is saved.
 *
 * @param bool $reset Whether to discard the cached value before returning.
 * @return WP_Block_Template|null
 */
function gutenberg_get_root_block_template( $reset = false ) {
	static $resolved = false;
	static $cached   = null;

	if ( $reset ) {
		$resolved = false;
		$cached   = null;
	}

	if ( $resolved ) {
		return $cached;
	}
	$resolved = true;

	$id     = get_stylesheet() . '//root';
	$cached = get_block_template( $id, 'wp_template' );
	return $cached;
}

/**
 * Invalidates the cached root block template after any `wp_template` post is
 * saved, so subsequent renders in the same request pick up the fresh content.
 * Cheap (just resets two PHP statics).
 */
add_action( 'save_post_wp_template', 'gutenberg_clear_root_block_template_cache' );
function gutenberg_clear_root_block_template_cache() {
	gutenberg_get_root_block_template( true );
}

/**
 * Swaps the resolved template content for the root template, stashing the
 * inner template id so `core/template-content` can render the original.
 *
 * Hooked on `template_include`, which fires after the `*_template` filter
 * chain has populated `$_wp_current_template_id` and
 * `$_wp_current_template_content`.
 *
 * @global string $_wp_current_template_id
 * @global string $_wp_current_template_content
 *
 * @param string $template Resolved template path (unchanged by this filter).
 * @return string
 */
function gutenberg_root_template_swap( $template ) {
	global $_wp_current_template_id, $_wp_current_template_content;

	if ( empty( $_wp_current_template_id ) ) {
		return $template;
	}

	// If we are already rendering root (e.g. directly visiting it via the editor preview), skip.
	$separator = strpos( $_wp_current_template_id, '//' );
	$slug      = false === $separator ? $_wp_current_template_id : substr( $_wp_current_template_id, $separator + 2 );
	if ( 'root' === $slug ) {
		return $template;
	}

	$root = gutenberg_get_root_block_template();
	if ( ! $root ) {
		return $template;
	}

	// Stash the inner template id for `core/template-content`.
	$GLOBALS['_wp_current_inner_template_id'] = $_wp_current_template_id;

	$_wp_current_template_id      = $root->id;
	$_wp_current_template_content = $root->content;

	return $template;
}
// `template_include` fires after the `*_template` filter chain, so by the
// time this runs, `$_wp_current_template_id` / `$_wp_current_template_content`
// are already populated. Default priority is sufficient.
add_filter( 'template_include', 'gutenberg_root_template_swap' );

/**
 * Registers the `root` template type with the standard hierarchy types so it
 * gets a proper title and description in the Site Editor's templates list.
 *
 * Only adds the entry when the active theme actually provides a `root.html`,
 * so themes that don't use the wrapping pattern don't see "Root" as an
 * available template type in the "Add new" UI.
 *
 * @param array $template_types Map of template slug to type metadata.
 * @return array
 */
function gutenberg_register_root_template_type( $template_types ) {
	if ( isset( $template_types['root'] ) ) {
		return $template_types;
	}
	if ( ! gutenberg_get_root_block_template() ) {
		return $template_types;
	}
	$template_types['root'] = array(
		'title'       => _x( 'Root', 'Template name' ),
		'description' => __( 'This template wraps every page. Use it to define site-wide scaffolding (header, footer, navigation, sidebars) once. Requires a Template Content block inside which renders the correct template in the WordPress hierarchy.' ),
	);
	return $template_types;
}
add_filter( 'default_template_types', 'gutenberg_register_root_template_type' );
