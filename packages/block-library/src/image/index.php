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

function has_link_destination( $attributes ) {
	if ( isset($attributes['linkDestination']) && $attributes['linkDestination'] !== 'none') {
		return true;
	} else if ( ! isset($attributes['linkDestination']) ) {
		return false;
	}
	return false;
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

	$background_color = wp_get_global_styles(['color', 'background']);

	if( ! has_link_destination( $attributes ) && isset( $attributes['enableLightbox'] ) && $attributes['enableLightbox'] === true ) {
		$body_content = new WP_HTML_Tag_Processor( $content );

		$body_content->next_tag( 'img' );

		if ( processor_img_src_is_null( $body_content ) ) {
			return '';
		}

		$body_content = process_img_data_id($body_content, $attributes);
		$body_content = $body_content->get_updated_html();

		$modal_content = new WP_HTML_Tag_Processor( $content );
		$modal_content->next_tag( 'img' );
		$modal_content = process_img_data_id($modal_content, $attributes);
		$modal_content = $modal_content->get_updated_html();

		$toggle_close_button_icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" focusable="false"><path d="M13 11.8l6.1-6.3-1-1-6.1 6.2-6.1-6.2-1 1 6.1 6.3-6.5 6.7 1 1 6.5-6.6 6.5 6.6 1-1z"></path></svg>';

		return <<<HTML
			<div class="wp-lightbox-container"
				 data-wp-island=''
				 data-wp-context='{ "core": { "initialized": false, "lightboxEnabled": false, "lastFocusedElement": null } }'>
					<button aria-haspopup='dialog' aria-description='opens lightbox' data-wp-on.click='actions.core.showLightbox'>
						$body_content
					</button>
					<div data-wp-portal="body" class="wp-lightbox-overlay"
						 aria-hidden="true"
						 data-wp-class.initialized="context.core.initialized"
						 data-wp-class.active="context.core.lightboxEnabled"
						 data-wp-init.hideLightboxOnEsc='actions.core.hideLightboxOnEsc'
						 data-wp-init.hideLightboxOnTab='actions.core.hideLightboxOnTab'
						 data-wp-effect="actions.core.toggleAriaHidden"
						 >
							$modal_content
							<button aria-label="Close lightbox" class="close-button" data-wp-on.click="actions.core.hideLightbox" data-wp-effect="actions.core.focusOnClose">
								$toggle_close_button_icon
							</button>
							<div class="hide" data-wp-on.click="actions.core.hideLightbox"></div>
							<div class="scrim" style='background-color: $background_color'></div>
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

	wp_enqueue_script(
		'interactivity-image',
		plugins_url('../interactive-blocks/image.min.js', __FILE__ ),
		array( 'interactivity-runtime' )
	);

	register_block_type_from_metadata(
		__DIR__ . '/image',
		array(
			'render_callback' => 'render_block_core_image',
		)
	);
}
add_action( 'init', 'register_block_core_image' );
