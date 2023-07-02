<?php
/**
 * Behaviors block support flag.
 *
 * @package gutenberg
 */

/**
 * Registers the behaviors block attribute for block types that support it.
 * And add the needed hooks to add those behaviors.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_behaviors_support( $block_type ) {
	$has_behaviors_support = block_has_support( $block_type, array( 'behaviors' ), false );
	if ( ! $has_behaviors_support ) {
		return;
	}

	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	$block_type->attributes['behaviors'] = array(
		'type' => 'object',
	);

	// If it supports the lightbox behavior, add the hook to that block.
	// In the future, this should be a loop with all the behaviors.
	$has_lightbox_support = block_has_support( $block_type, array( 'behaviors', 'lightbox' ), false );
	if ( $has_lightbox_support ) {
		// Use priority 15 to run this hook after other hooks/plugins.
		// They could use the `render_block_{$this->name}` filter to modify the markup.
		add_filter( 'render_block_' . $block_type->name, 'gutenberg_render_behaviors_support_lightbox', 15, 2 );
	}
}

/**
 * Add the directives and layout needed for the lightbox behavior.
 * This functions shouldn't be in this file. It should be moved to a package (or somewhere else), where all the behaviors logic is defined.
 *
 * @param  string $block_content Rendered block content.
 * @param  array  $block         Block object.
 * @return string                Filtered block content.
 */
function gutenberg_render_behaviors_support_lightbox( $block_content, $block ) {
	$experiments      = get_option( 'gutenberg-experiments' );
	$link_destination = isset( $block['attrs']['linkDestination'] ) ? $block['attrs']['linkDestination'] : 'none';
	// Get the lightbox setting from the block attributes.
	if ( isset( $block['attrs']['behaviors']['lightbox'] ) ) {
		$lightbox_settings = $block['attrs']['behaviors']['lightbox'];
		// If the lightbox setting is not set in the block attributes, get it from the theme.json file.
	} else {
		$theme_data = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data()->get_data();
		if ( isset( $theme_data['behaviors']['blocks'][ $block['blockName'] ]['lightbox'] ) ) {
			$lightbox_settings = $theme_data['behaviors']['blocks'][ $block['blockName'] ]['lightbox'];
		} else {
			$lightbox_settings = null;
		}
	}

	if ( isset( $lightbox_settings['enabled'] ) && false === $lightbox_settings['enabled'] ) {
		return $block_content;
	}

	if ( ! $lightbox_settings || 'none' !== $link_destination || empty( $experiments['gutenberg-interactivity-api-core-blocks'] ) ) {
		return $block_content;
	}

	$processor = new WP_HTML_Tag_Processor( $block_content );

	$aria_label = __( 'Enlarge image', 'gutenberg' );

	$alt_attribute = trim( $processor->get_attribute( 'alt' ) );

	if ( $alt_attribute ) {
		/* translators: %s: Image alt text. */
		$aria_label = sprintf( __( 'Enlarge image: %s', 'gutenberg' ), $alt_attribute );
	}
	$content = $processor->get_updated_html();

	// If we don't set a default, it won't work if Lightbox is set to enabled by default.
	$lightbox_animation = 'zoom';
	if ( isset( $lightbox_settings['animation'] ) && '' !== $lightbox_settings['animation'] ) {
		$lightbox_animation = $lightbox_settings['animation'];
	}

	// We want to store the src in the context so we can set it dynamically when the lightbox is opened.
	$z = new WP_HTML_Tag_Processor( $content );
	$z->next_tag( 'img' );

	if ( isset( $block['attrs']['id'] ) ) {
		$img_uploaded_src    = wp_get_attachment_url( $block['attrs']['id'] );
		$img_metadata        = wp_get_attachment_metadata( $block['attrs']['id'] );
		$img_width           = $img_metadata['width'];
		$img_height          = $img_metadata['height'];
		$img_uploaded_srcset = wp_get_attachment_image_srcset( $block['attrs']['id'] );
	} else {
		$img_uploaded_src    = $z->get_attribute( 'src' );
		$img_width           = 'none';
		$img_height          = 'none';
		$img_uploaded_srcset = '';
	}

	$w = new WP_HTML_Tag_Processor( $content );
	$w->next_tag( 'figure' );
	$w->add_class( 'wp-lightbox-container' );
	$w->set_attribute( 'data-wp-interactive', true );
	$w->set_attribute(
		'data-wp-context',
		sprintf(
			'{ "core":
				{ "image":
					{   "imageLoaded": false,
						"initialized": false,
						"lightboxEnabled": false,
						"hideAnimationEnabled": false,
						"preloadInitialized": false,
						"lightboxAnimation": "%s",
						"imageUploadedSrc": "%s",
						"imageCurrentSrc": "",
						"imageSrcSet": "%s",
						"targetWidth": "%s",
						"targetHeight": "%s"
					}
				}
			}',
			$lightbox_animation,
			$img_uploaded_src,
			$img_uploaded_srcset,
			$img_width,
			$img_height
		)
	);
	$w->next_tag( 'img' );
	$w->set_attribute( 'data-wp-effect', 'effects.core.image.setCurrentSrc' );
	$body_content = $w->get_updated_html();

	// Wrap the image in the body content with a button.
	$img = null;
	preg_match( '/<img[^>]+>/', $body_content, $img );
	$button       = '<div class="img-container">
                             <button type="button" aria-haspopup="dialog" aria-label="' . esc_attr( $aria_label ) . '" data-wp-on--click="actions.core.image.showLightbox" data-wp-on--mouseenter="actions.core.image.preloadLightboxImage"></button>'
		. $img[0] .
		'</div>';
	$body_content = preg_replace( '/<img[^>]+>/', $button, $body_content );

	// Add src to the modal image.
	$m = new WP_HTML_Tag_Processor( $content );
	$m->next_tag( 'figure' );
	$m->add_class( 'responsive-image' );
	$m->next_tag( 'img' );
	$m->set_attribute( 'src', '' );
	$m->set_attribute( 'data-wp-bind--src', 'selectors.core.image.responsiveImgSrc' );
	$initial_image_content = $m->get_updated_html();

	$q = new WP_HTML_Tag_Processor( $content );
	$q->next_tag( 'figure' );
	$q->add_class( 'enlarged-image' );
	$q->next_tag( 'img' );
	$q->set_attribute( 'src', '' );
	$q->set_attribute( 'data-wp-bind--src', 'selectors.core.image.enlargedImgSrc' );
	$enlarged_image_content = $q->get_updated_html();

	$background_color = esc_attr( wp_get_global_styles( array( 'color', 'background' ) ) );

	$close_button_icon  = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" focusable="false"><path d="M13 11.8l6.1-6.3-1-1-6.1 6.2-6.1-6.2-1 1 6.1 6.3-6.5 6.7 1 1 6.5-6.6 6.5 6.6 1-1z"></path></svg>';
	$close_button_color = esc_attr( wp_get_global_styles( array( 'color', 'text' ) ) );
	$dialog_label       = $alt_attribute ? esc_attr( $alt_attribute ) : esc_attr__( 'Image', 'gutenberg' );
	$close_button_label = esc_attr__( 'Close', 'gutenberg' );

	$lightbox_html = <<<HTML
        <div data-wp-body="" class="wp-lightbox-overlay $lightbox_animation"
            data-wp-bind--role="selectors.core.image.roleAttribute"
            aria-label="$dialog_label"
            data-wp-class--initialized="context.core.image.initialized"
            data-wp-class--active="context.core.image.lightboxEnabled"
			data-wp-class--hideAnimationEnabled="context.core.image.hideAnimationEnabled"
            data-wp-bind--aria-hidden="!context.core.image.lightboxEnabled"
            data-wp-bind--aria-modal="context.core.image.lightboxEnabled"
            data-wp-effect="effects.core.image.initLightbox"
            data-wp-on--keydown="actions.core.image.handleKeydown"
            data-wp-on--mousewheel="actions.core.image.hideLightbox"
            data-wp-on--click="actions.core.image.hideLightbox"
            >
                <button type="button" aria-label="$close_button_label" style="fill: $close_button_color" class="close-button" data-wp-on--click="actions.core.image.hideLightbox">
                    $close_button_icon
                </button>
                $initial_image_content
				$enlarged_image_content
                <div class="scrim" style="background-color: $background_color"></div>
        </div>
HTML;

	return str_replace( '</figure>', $lightbox_html . '</figure>', $body_content );
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'behaviors',
	array(
		'register_attribute' => 'gutenberg_register_behaviors_support',
	)
);
