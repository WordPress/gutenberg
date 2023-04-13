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
 * @param  array  $attributes The block attributes.
 * @param  string $content    The block content.
 * @return string Returns the block content with the data-id attribute added.
 */
function render_block_core_image( $attributes, $content ) {
	$processor = new WP_HTML_Tag_Processor( $content );

	if( isset( $attributes['enableLightbox'] ) && $attributes['enableLightbox'] === true ) {
		$processor->next_tag( 'figure' );
		$processor->set_attribute( 'data-wp-class.isZoomed', 'context.core.isZoomed');
		$processor->set_attribute( 'data-wp-init.closeZoomOnEsc', 'actions.core.closeZoomOnEsc');
	}

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
		$content = $processor->get_updated_html();
	}

	if( isset( $attributes['enableLightbox'] ) && $attributes['enableLightbox'] === true ) {
		/// Include conditional to detect if user has activated lightbox in settings #2
		$processor->set_attribute( 'data-wp-on.click', 'actions.core.imageZoom');
		$content = $processor->get_updated_html();
		return <<<HTML
			<div class="lightbox-container" data-wp-context='{ "core": { "isZoomed": false } }'>
				$content
				<div data-wp-portal="body" data-wp-class.overlay="context.core.isZoomed">
					<div data-wp-on.click="actions.core.closeZoom"></div>
				</div>
			</div>
		HTML;
	}

	return $content;
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
