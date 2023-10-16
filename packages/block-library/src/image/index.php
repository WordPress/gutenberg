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
 * @param array    $attributes The block attributes.
 * @param string   $content    The block content.
 * @param WP_Block $block      The block object.
 *
 * @return string The block content with the data-id attribute added.
 */
function render_block_core_image( $attributes, $content, $block ) {
	if ( false === stripos( $content, '<img' ) ) {
		return '';
	}

	$processor = new WP_HTML_Tag_Processor( $content );

	if ( ! $processor->next_tag( 'IMG' ) || null === $processor->get_attribute( 'src' ) ) {
		return '';
	}

	if ( isset( $attributes['data-id'] ) ) {
		// Add the data-id="$id" attribute to the img element
		// to provide backwards compatibility for the Gallery Block,
		// which now wraps Image Blocks within innerBlocks.
		// The data-id attribute is added in a core/gallery `render_block_data` hook.
		$processor->set_attribute( 'data-id', $attributes['data-id'] );
	}

	$link_destination  = isset( $attributes['linkDestination'] ) ? $attributes['linkDestination'] : 'none';
	$lightbox_settings = block_core_image_get_lightbox_settings( $block->parsed_block );

	$view_js_file_handle = 'wp-block-image-view';
	$script_handles      = $block->block_type->view_script_handles;

	/*
	 * If the lightbox is enabled and the image is not linked, add the filter
	 * and the JavaScript view file.
	 */
	if (
		isset( $lightbox_settings ) &&
		'none' === $link_destination &&
		isset( $lightbox_settings['enabled'] ) &&
		true === $lightbox_settings['enabled']
	) {
		$block->block_type->supports['interactivity'] = true;

		if ( ! in_array( $view_js_file_handle, $script_handles, true ) ) {
			$block->block_type->view_script_handles = array_merge( $script_handles, array( $view_js_file_handle ) );
		}

		/*
		 * This render needs to happen in a filter with priority 15 to ensure
		 * that it runs after the duotone filter and that duotone styles are
		 * applied to the image in the lightbox. We also need to ensure that the
		 * lightbox works with any plugins that might use filters as well. We
		 * can consider removing this in the future if the way the blocks are
		 * rendered changes, or if a new kind of filter is introduced.
		 */
		add_filter( 'render_block_core/image', 'block_core_image_render_lightbox', 15, 2 );
	} else {
		/*
		 * Remove the filter and the JavaScript view file if previously added by
		 * other Image blocks.
		 */
		remove_filter( 'render_block_core/image', 'block_core_image_render_lightbox', 15 );
		// If the script is not needed, and it is still in the `view_script_handles`, remove it.
		if ( in_array( $view_js_file_handle, $script_handles, true ) ) {
			$block->block_type->view_script_handles = array_diff( $script_handles, array( $view_js_file_handle ) );
		}
	}

	return $processor->get_updated_html();
}

/**
 * Adds the lightboxEnabled flag to the block data.
 *
 * This is used to determine whether the lightbox should be rendered or not.
 *
 * @param array $block Block data.
 *
 * @return array Filtered block data.
 */
function block_core_image_get_lightbox_settings( $block ) {
	// Get the lightbox setting from the block attributes.
	if ( isset( $block['attrs']['lightbox'] ) ) {
		$lightbox_settings = $block['attrs']['lightbox'];
		// If the lightbox setting is not set in the block attributes,
		// check the legacy lightbox settings that are set using the
		// `gutenberg_should_render_lightbox` filter.
		// We can remove this elseif statement when the legacy lightbox settings are removed.
	} elseif ( isset( $block['legacyLightboxSettings'] ) ) {
		$lightbox_settings = $block['legacyLightboxSettings'];
	}

	if ( ! isset( $lightbox_settings ) ) {
		$lightbox_settings = wp_get_global_settings( array( 'lightbox' ), array( 'block_name' => 'core/image' ) );

		// If not present in global settings, check the top-level global settings.
		//
		// NOTE: If no block-level settings are found, the previous call to
		// `wp_get_global_settings` will return the whole `theme.json`
		// structure in which case we can check if the "lightbox" key is present at
		// the top-level of the global settings and use its value.
		if ( isset( $lightbox_settings['lightbox'] ) ) {
			$lightbox_settings = wp_get_global_settings( array( 'lightbox' ) );
		}
	}

	return $lightbox_settings ?? null;
}

/**
 * Adds the directives and layout needed for the lightbox behavior.
 *
 * @param string $block_content Rendered block content.
 * @param array  $block         Block object.
 *
 * @return string Filtered block content.
 */
function block_core_image_render_lightbox( $block_content, $block ) {
	/*
	 * If there's no possible IMG element in the block then there's nothing this code
	 * can reliably do to add the lightbox because it doesn't understand the structure
	 * of the block's HTML. The block may have never had an image assigned to it, or
	 * some other plugin code may have already modified the contents.
	 */
	if ( false === stripos( $block_content, '<img' ) ) {
		return $block_content;
	}

	$processor = new WP_HTML_Tag_Processor( $block_content );

	if ( ! $processor->next_tag() ) {
		return $block_content;
	}

	/*
	 * If there's definitely no IMG element in the block then return the given
	 * block content as-is. There's nothing that this code can knowingly modify
	 * to add the lightbox behavior.
	 */
	$processor->set_bookmark( 'first tag' );

	// Find the first IMG if it isn't the first tag.
	if ( 'IMG' !== $processor->get_tag() && ! $processor->next_tag( 'IMG' ) ) {
		return $block_content;
	}

	$alt_attribute = $processor->get_attribute( 'alt' );
	$alt_attribute = is_string( $alt_attribute ) ? trim( $alt_attribute ) : null;

	if ( ! empty( $alt_attribute ) ) {
		/* translators: %s: Image alt text. */
		$aria_label = sprintf( __( 'Enlarge image: %s' ), $alt_attribute );
	} else {
		$aria_label = __( 'Enlarge image' );
	}

	// Currently, we are only enabling the zoom animation.
	$lightbox_animation = 'zoom';

	// Note: We want to store the `src` in the context so we
	// can set it dynamically when the lightbox is opened.
	if ( isset( $block['attrs']['id'] ) ) {
		$img_uploaded_src = wp_get_attachment_url( $block['attrs']['id'] );
		$img_metadata     = wp_get_attachment_metadata( $block['attrs']['id'] );
		$img_width        = $img_metadata['width'] ?? 'none';
		$img_height       = $img_metadata['height'] ?? 'none';
	} else {
		$img_uploaded_src = $processor->get_attribute( 'src' );
		$img_width        = 'none';
		$img_height       = 'none';
	}

	if ( isset( $block['attrs']['scale'] ) ) {
		$scale_attr = $block['attrs']['scale'];
	} else {
		$scale_attr = false;
	}

	// Jump back to the first tag and find the first figure.
	$processor->seek( 'first tag' );
	if ( 'FIGURE' !== $processor->get_tag() && ! $processor->next_tag( 'FIGURE' ) ) {
		return $block_content;
	}

	$processor->set_bookmark( 'figure' );
	$processor->add_class( 'wp-lightbox-container' );
	$processor->set_attribute( 'data-wp-interactive', true );
	$processor->set_attribute(
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
						"targetWidth": "%s",
						"targetHeight": "%s",
						"scaleAttr": "%s",
						"dialogLabel": "%s"
					}
				}
			}',
			$lightbox_animation,
			$img_uploaded_src,
			$img_width,
			$img_height,
			$scale_attr,
			__( 'Enlarged image' )
		)
	);

	/*
	 * Starting at a matched FIGURE element, assume that the next IMG element is inside it.
	 * It could be that there's no IMG inside this FIGURE, but for now, it's a strong enough
	 * assumption to work most of the time. Either way, if no IMG exists, then there is
	 * nothing to possibly do, so return the unmodified content.
	 */
	if ( ! $processor->next_tag( 'IMG' ) ) {
		return $block_content;
	}

	$processor->set_attribute( 'data-wp-init', 'effects.core.image.setCurrentSrc' );
	$processor->set_attribute( 'data-wp-on--load', 'actions.core.image.handleLoad' );
	$processor->set_attribute( 'data-wp-effect', 'effects.core.image.setButtonStyles' );
	$processor->set_attribute( 'data-wp-effect--setStylesOnResize', 'effects.core.image.setStylesOnResize' );
	$body_content = $processor->get_updated_html();

	/*
	 * Insert a button in the body content before the image.
	 *
	 * Note that this match should never fail since it's already been
	 * established that an IMG element exists within the body content.
	 */
	$img_match = null;
	if ( false === preg_match( '/<img[^>]+>/i', $body_content, $img_match, PREG_OFFSET_CAPTURE ) ) {
		return $block_content;
	}

	list( $image_tag, $image_at ) = $img_match[0];

	$button =
		'<button
			type="button"
			aria-haspopup="dialog"
			aria-label="' . esc_attr( $aria_label ) . '"
			data-wp-on--click="actions.core.image.showLightbox"
			data-wp-style--width="context.core.image.imageButtonWidth"
			data-wp-style--height="context.core.image.imageButtonHeight"
			data-wp-style--left="context.core.image.imageButtonLeft"
			data-wp-style--top="context.core.image.imageButtonTop"
		></button>';

	$end_of_img_tag = $image_at + strlen( $image_tag );
	$body_content   = substr( $body_content, 0, $end_of_img_tag ) . $button . substr( $body_content, $end_of_img_tag );

	/*
	 * This code needs to generate a responsive image and an enlarged image
	 * to animate zoom seamlessly on slow internet connections; the responsive
	 * image is a copy of the one in the body, which animates immediately
	 * as the lightbox is opened, while the enlarged one is a full-sized
	 * version that will likely still be loading as the animation begins.
	 *
	 * In order to reuse the existing Tag Processor, changes made before
	 * need to be undone before setting the new changes here.
	 */
	$processor->seek( 'figure' );
	$processor->remove_class( 'wp-lightbox-container' );
	$processor->remove_attribute( 'data-wp-context' );
	$processor->remove_attribute( 'data-wp-interactive' );
	$processor->add_class( 'responsive-image' );

	$processor->seek( 'figure' );
	$processor->next_tag( 'img' );
	$processor->remove_attribute( 'data-wp-init' );
	$processor->remove_attribute( 'data-wp-on--load' );
	$processor->remove_attribute( 'data-wp-effect' );

	/*
	 * The 'src' attribute needs to be an empty string in the responsive image because
	 * otherwise, as of this writing, the wp_filter_content_tags() function in WordPress
	 * will automatically add a 'srcset' attribute to the image, which will at times
	 * cause the incorrectly sized image to be loaded in the lightbox on Firefox.
	 *
	 * Because of this, the 'src' attribute needs to be explicitly bound to the current
	 * src to reliably use the exact same image as in the content when the lightbox is
	 * first opened while waiting for the larger image to load.
	 */
	$processor->set_attribute( 'src', '' );
	$processor->set_attribute( 'data-wp-bind--src', 'context.core.image.imageCurrentSrc' );
	$processor->set_attribute( 'data-wp-style--object-fit', 'selectors.core.image.lightboxObjectFit' );
	$initial_image_content = $processor->get_updated_html();

	/*
	 * Reusing the existing Tag Processor again requires resetting state.
	 */
	$processor->seek( 'figure' );
	$processor->remove_class( 'responsive-image' );
	$processor->add_class( 'enlarged-image' );

	/*
	 * It's necessary to set the 'src' attribute to an empty string to prevent the browser from loading the image
	 * on initial page load, then to bind the attribute to a selector that returns the full-sized image src when
	 * the lightbox is opened. The combination of 'loading=lazy' with the 'hidden' attribute could be used to
	 * accomplish the same behavior, but that approach breaks progressive loading of the image in Safari
	 * and Chrome (see https://github.com/WordPress/gutenberg/pull/52765#issuecomment-1674008151). Until that
	 * is resolved, manually setting the 'src' loads the large image on demand without causing renderering issues.
	 */
	$processor->next_tag( 'img' );
	$processor->set_attribute( 'data-wp-bind--src', 'selectors.core.image.enlargedImgSrc' );
	$processor->set_attribute( 'data-wp-style--object-fit', 'selectors.core.image.lightboxObjectFit' );
	$enlarged_image_content = $processor->get_updated_html();

	// If the current theme does NOT have a `theme.json`, or the colors are not defined,
	// we need to set the background color & close button color to some default values
	// because we can't get them from the Global Styles.
	$background_color   = '#fff';
	$close_button_color = '#000';
	if ( wp_theme_has_theme_json() ) {
		$global_styles_color = wp_get_global_styles( array( 'color' ) );
		if ( ! empty( $global_styles_color['background'] ) ) {
			$background_color = esc_attr( $global_styles_color['background'] );
		}
		if ( ! empty( $global_styles_color['text'] ) ) {
			$close_button_color = esc_attr( $global_styles_color['text'] );
		}
	}

	$close_button_icon  = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" focusable="false"><path d="M13 11.8l6.1-6.3-1-1-6.1 6.2-6.1-6.2-1 1 6.1 6.3-6.5 6.7 1 1 6.5-6.6 6.5 6.6 1-1z"></path></svg>';
	$close_button_label = esc_attr__( 'Close' );

	$lightbox_html = <<<HTML
        <div data-wp-body="" class="wp-lightbox-overlay $lightbox_animation"
            data-wp-bind--role="selectors.core.image.roleAttribute"
            data-wp-bind--aria-label="selectors.core.image.dialogLabel"
            data-wp-class--initialized="context.core.image.initialized"
            data-wp-class--active="context.core.image.lightboxEnabled"
            data-wp-class--hideAnimationEnabled="context.core.image.hideAnimationEnabled"
            data-wp-bind--aria-modal="selectors.core.image.ariaModal"
            data-wp-effect="effects.core.image.initLightbox"
            data-wp-on--keydown="actions.core.image.handleKeydown"
            data-wp-on--touchstart="actions.core.image.handleTouchStart"
            data-wp-on--touchmove="actions.core.image.handleTouchMove"
            data-wp-on--touchend="actions.core.image.handleTouchEnd"
            data-wp-on--click="actions.core.image.hideLightbox"
            >
                <button type="button" aria-label="$close_button_label" style="fill: $close_button_color" class="close-button" data-wp-on--click="actions.core.image.hideLightbox">
                    $close_button_icon
                </button>
                <div class="lightbox-image-container">$initial_image_content</div>
				<div class="lightbox-image-container">$enlarged_image_content</div>
                <div class="scrim" style="background-color: $background_color" aria-hidden="true"></div>
        </div>
HTML;

	return str_replace( '</figure>', $lightbox_html . '</figure>', $body_content );
}

/**
 * Ensures that the view script has the `wp-interactivity` dependency.
 *
 * @since 6.4.0
 *
 * @global WP_Scripts $wp_scripts
 */
function block_core_image_ensure_interactivity_dependency() {
	global $wp_scripts;
	if (
		isset( $wp_scripts->registered['wp-block-image-view'] ) &&
		! in_array( 'wp-interactivity', $wp_scripts->registered['wp-block-image-view']->deps, true )
	) {
		$wp_scripts->registered['wp-block-image-view']->deps[] = 'wp-interactivity';
	}
}

add_action( 'wp_print_scripts', 'block_core_image_ensure_interactivity_dependency' );

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
