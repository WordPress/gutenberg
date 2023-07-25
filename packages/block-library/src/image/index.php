<?php
/**
 * Server-side rendering of the `core/image` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/image` block on the server,
 * adding a data-id attribute to the element if core/gallery has added on pre-render.
 *
 * @param  array    $attributes The block attributes.
 * @param  string   $content    The block content.
 * @param  WP_Block $block    The block object.
 * @return string Returns the block content with the data-id attribute added.
 */
function render_block_core_image( $attributes, $content, $block ) {

	$processor = new WP_HTML_Tag_Processor( $content );
	$processor->next_tag( 'img' );

	if ( $processor->get_attribute( 'src' ) === null ) {
		return '';
	}

	if ( isset( $attributes['data-id'] ) ) {
		// Add the data-id="$id" attribute to the img element
		// to provide backwards compatibility for the Gallery Block,
		// which now wraps Image Blocks within innerBlocks.
		// The data-id attribute is added in a core/gallery `render_block_data` hook.
		$processor->set_attribute( 'data-id', $attributes['data-id'] );
	}

	$should_load_view_script = false;
	$link_destination        = isset( $attributes['linkDestination'] ) ? $attributes['linkDestination'] : 'none';
	// Get the lightbox setting from the block attributes.
	if ( isset( $attributes['behaviors']['lightbox'] ) ) {
		$lightbox_settings = $attributes['behaviors']['lightbox'];
		// If the lightbox setting is not set in the block attributes, get it from the theme.json file.
	} else {
		$theme_data = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data()->get_data();
		if ( isset( $theme_data['behaviors']['blocks'][ $block->name ]['lightbox'] ) ) {
			$lightbox_settings = $theme_data['behaviors']['blocks'][ $block->name ]['lightbox'];
		} else {
			$lightbox_settings = null;
		}
	}

	// If the lightbox is enabled, the image is not linked, and the Interactivity API is enabled, load the view script.
	if ( isset( $lightbox_settings['enabled'] ) &&
		true === $lightbox_settings['enabled'] &&
		'none' === $link_destination
	) {
		$should_load_view_script = true;
	}

	$view_js_file = 'wp-block-image-view';
	if ( ! wp_script_is( $view_js_file ) ) {
		$script_handles = $block->block_type->view_script_handles;

		// If the script is not needed, and it is still in the `view_script_handles`, remove it.
		if ( ! $should_load_view_script && in_array( $view_js_file, $script_handles, true ) ) {
			$block->block_type->view_script_handles = array_diff( $script_handles, array( $view_js_file ) );
		}
		// If the script is needed, but it was previously removed, add it again.
		if ( $should_load_view_script && ! in_array( $view_js_file, $script_handles, true ) ) {
			$block->block_type->view_script_handles = array_merge( $script_handles, array( $view_js_file ) );
		}
	}

	return $processor->get_updated_html();
}

	/**
	 * Registers the `core/image` block on server.
	 */
function register_block_core_image() {
	register_block_type_from_metadata(
		__DIR__ . '/image',
		array(
			'render_callback' => 'render_block_core_image',
		)
	);
}
	add_action( 'init', 'register_block_core_image' );
