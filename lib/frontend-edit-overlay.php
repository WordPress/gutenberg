<?php
/**
 * Frontend Edit Overlay
 *
 * Adds "Edit this" hover-over buttons on the site frontend for template parts and post content.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'gutenberg_is_experiment_enabled' ) ) {
	return;
}

if ( ! gutenberg_is_experiment_enabled( 'gutenberg-frontend-edit-overlay' ) ) {
	return;
}

// Only enable for block themes.
if ( ! wp_is_block_theme() ) {
	return;
}

/**
 * Generate the edit URL for a template part.
 *
 * @param string $template_part_id The template part ID in the format {theme}//{slug}.
 * @return string The edit URL for the site editor in edit mode.
 */
function gutenberg_get_frontend_edit_overlay_template_part_url( $template_part_id ) {
	return add_query_arg(
		array(
			'p'      => '/wp_template_part/' . $template_part_id,
			'canvas' => 'edit',
		),
		admin_url( 'site-editor.php' )
	);
}

/**
 * Generate the edit URL for a post.
 *
 * @param int $post_id The post ID.
 * @return string The edit URL for the post editor.
 */
function gutenberg_get_frontend_edit_overlay_post_url( $post_id ) {
	return add_query_arg(
		array(
			'post'   => $post_id,
			'action' => 'edit',
		),
		admin_url( 'post.php' )
	);
}

/**
 * Add edit overlay data attributes to rendered blocks.
 *
 * Hooks into the render_block filter to add data attributes to template parts
 * when the user has appropriate permissions.
 *
 * @param string $block_content The rendered block content.
 * @param array  $block         The parsed block array.
 * @return string The modified block content with data attributes.
 */
function gutenberg_add_frontend_edit_overlay_to_block( $block_content, $block ) {
	// Handle template part blocks.
	if ( 'core/template-part' === $block['blockName'] ) {
		// Check if user can edit theme options (required for site editor).
		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return $block_content;
		}

		if ( empty( $block['attrs']['slug'] ) ) {
			return $block_content;
		}

		$template_part_slug = $block['attrs']['slug'];
		$theme              = isset( $block['attrs']['theme'] ) ? $block['attrs']['theme'] : wp_get_theme()->get_stylesheet();
		$full_template_id   = $theme . '//' . $template_part_slug;

		// Get the edit URL.
		$edit_url = gutenberg_get_frontend_edit_overlay_template_part_url( $full_template_id );

		// Use WP_HTML_Tag_Processor to add data attributes to the wrapper element.
		$processor = new WP_HTML_Tag_Processor( $block_content );

		// Find the first tag (should be the wrapper element).
		if ( $processor->next_tag() ) {
			$processor->set_attribute( 'data-wp-edit-overlay-target', 'template-part' );
			$processor->set_attribute( 'data-wp-edit-template-part-id', $full_template_id );
			$processor->set_attribute( 'data-wp-edit-url', $edit_url );

			return $processor->get_updated_html();
		}

		return $block_content;
	}

	// Handle post title blocks.
	if ( 'core/post-title' === $block['blockName'] ) {
		// Get post ID from block context.
		if ( empty( $block['context']['postId'] ) ) {
			return $block_content;
		}

		$post_id = (int) $block['context']['postId'];

		// Check if user can edit this post.
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return $block_content;
		}

		// Get the edit URL.
		$edit_url = gutenberg_get_frontend_edit_overlay_post_url( $post_id );

		// Use WP_HTML_Tag_Processor to add data attributes to the wrapper element.
		$processor = new WP_HTML_Tag_Processor( $block_content );

		// Find the first tag (should be the wrapper element).
		if ( $processor->next_tag() ) {
			$processor->set_attribute( 'data-wp-edit-overlay-target', 'post-title' );
			$processor->set_attribute( 'data-wp-edit-post-id', $post_id );
			$processor->set_attribute( 'data-wp-edit-url', $edit_url );

			return $processor->get_updated_html();
		}

		return $block_content;
	}

	// Handle post content blocks.
	if ( 'core/post-content' === $block['blockName'] ) {
		// Get post ID from block context, or fall back to the current post from the main query loop.
		$post_id = ! empty( $block['context']['postId'] ) ? (int) $block['context']['postId'] : get_the_ID();

		if ( ! $post_id ) {
			return $block_content;
		}

		// Check if user can edit this post.
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return $block_content;
		}

		// Get the edit URL.
		$edit_url = gutenberg_get_frontend_edit_overlay_post_url( $post_id );

		// Use WP_HTML_Tag_Processor to add data attributes to the wrapper element.
		$processor = new WP_HTML_Tag_Processor( $block_content );

		// Find the first tag (should be the wrapper element).
		if ( $processor->next_tag() ) {
			$processor->set_attribute( 'data-wp-edit-overlay-target', 'post-content' );
			$processor->set_attribute( 'data-wp-edit-post-id', $post_id );
			$processor->set_attribute( 'data-wp-edit-url', $edit_url );

			return $processor->get_updated_html();
		}

		return $block_content;
	}

	return $block_content;
}

// Hook into the render_block filter to catch rendered template parts.
add_filter( 'render_block', 'gutenberg_add_frontend_edit_overlay_to_block', 10, 2 );
