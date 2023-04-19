<?php
/**
 * Server-side rendering of the `core/image` block.
 *
 * @package WordPress
 */


function processor_img_src_is_null( $processor ) {
	return $processor->get_attribute( 'src' ) === null;
}

function process_img_data_id( $processor, $attributes ) {

	if ( isset( $attributes['data-id'] ) ) {
		// Add the data-id="$id" attribute to the img element
		// to provide backwards compatibility for the Gallery Block,
		// which now wraps Image Blocks within innerBlocks.
		// The data-id attribute is added in a core/gallery `render_block_data` hook.
		$processor->set_attribute( 'data-id', $attributes['data-id'] );
	}

	return $processor;
}

/**
 * Renders the `core/image` block on the server,
 * adding a data-id attribute to the element if core/gallery has added on pre-render.
 *
 * @param  array  $attributes The block attributes.
 * @param  string $content    The block content.
 * @return string Returns the block content with the data-id attribute added.
 */
function render_block_core_image( $attributes, $content ) {
	if( isset( $attributes['enableLightbox'] ) && $attributes['enableLightbox'] === true ) {
		$body_content = new WP_HTML_Tag_Processor( $content );

		$body_content->next_tag( 'figure' );
		$body_content->set_attribute( 'data-wp-class.isZoomed', 'context.core.isZoomed');
		$body_content->set_attribute( 'data-wp-init.closeZoomOnEsc', 'actions.core.closeZoomOnEsc');

		$body_content->next_tag( 'img' );

		if ( processor_img_src_is_null( $body_content ) ) {
			return '';
		}

		$body_content = process_img_data_id($body_content, $attributes);
		$body_content->set_attribute( 'data-wp-on.click', 'actions.core.imageZoom');
		$body_content = $body_content->get_updated_html();

		$modal_content = new WP_HTML_Tag_Processor( $content );
		$modal_content->next_tag( 'img' );
		$modal_content = process_img_data_id($modal_content, $attributes);
		$modal_content = $modal_content->get_updated_html();

		return <<<HTML
			<div class="lightbox-container" data-wp-context='{ "core": { "initialized": false, "isZoomed": false } }'>
				$body_content
				<div data-wp-portal="body" class="overlay" data-wp-class.initialized="context.core.initialized" data-wp-class.active="context.core.isZoomed">
					$modal_content
					<div class="hide" data-wp-on.click="actions.core.closeZoom"></div>
				</div>
			</div>
		HTML;
	}

	$processor = new WP_HTML_Tag_Processor( $content );
	$processor->next_tag( 'img' );

	if ( processor_img_src_is_null( $processor ) ) {
		return '';
	}

	$processor = process_img_data_id($processor, $attributes);

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
