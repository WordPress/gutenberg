<?php
/**
 * Filters used by Gutenberg to extend core functionality.
 *
 * @package gutenberg
 */

/**
 * Filters the title of the default page template displayed in the drop-down on the post editor
 *
 * @param string $label   The display value for the default page template title.
 * @param string $context Where the option label is displayed.
 * @return string The new display value for the default page template title.
 */
function gutenberg_add_template_to_default_template_title( $label, $context = '' ) {
	global $post_type, $post;
	if (
		__( 'Default template', 'gutenberg' ) !== $label ||
		empty( $post ) || empty( $post_type ) ||
		! current_theme_supports( 'block-templates' ) ||
		'meta-box' === $context
	) {
		return $label;
	}

	$block_template = '';
	if ( 'page' === $post_type ) {
		$templates = array();
		if ( ! empty( $post->post_name ) ) {
			$templates[] = "page-{$post->post_name}";
		}
		if ( ! empty( $post->ID ) ) {
			$templates[] = "page-{$post->ID}";
		}
		$templates[] = 'page';

		$block_template = resolve_block_template( 'page', $templates, '' );
	} else {
		$templates = array();
		if ( ! empty( $post->post_name ) ) {
			$templates[] = "single-{$post_type}-{$post->post_name}";
		}
		$templates[] = "single-{$post_type}";
		$templates[] = 'single';

		$block_template = resolve_block_template( 'single', $templates, '' );
	}
	if ( empty( $block_template ) ) {
		$block_template = resolve_block_template( 'singular', array(), '' );
	}

	if ( ! empty( $block_template ) ) {
		$title = $block_template->title;
		if ( empty( $title ) ) {
			$title = $block_template->slug;
		}
		if ( ! empty( $title ) ) {
			return sprintf(
				// translators: %s is the template name e.g.: Single, Page, etc.
				__( '%s (default)', 'gutenberg' ),
				$title
			);
		}
	}
	return $label;
}
add_filter( 'default_page_template_title', 'gutenberg_add_template_to_default_template_title' );
